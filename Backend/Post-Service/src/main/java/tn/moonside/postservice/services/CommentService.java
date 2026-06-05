package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import tn.moonside.postservice.audit.AuditClient;
import tn.moonside.postservice.audit.PostAuditAction;
import tn.moonside.postservice.clients.OrganizationClient;
import tn.moonside.postservice.clients.UserClient;
import tn.moonside.postservice.dtos.requests.CommentRequest;
import tn.moonside.postservice.dtos.responses.CommentResponse;
import tn.moonside.postservice.entities.Comment;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.event.NotificationEvent;
import tn.moonside.postservice.kafka.NotificationEventPublisher;
import tn.moonside.postservice.repositories.CommentRepository;
import tn.moonside.postservice.repositories.PostRepository;
import tn.moonside.postservice.repositories.ReactionRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final ReactionRepository reactionRepository;
    private final OrganizationClient organizationClient;
    private final AuditClient auditClient;
    private final UserClient userClient;
    private final NotificationEventPublisher notificationPublisher;

    public CommentResponse addComment(String postId, CommentRequest req, String authorId) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("Post not found: " + postId);
        }
        if (req.getParentId() != null && !commentRepository.existsById(req.getParentId())) {
            throw new IllegalArgumentException("Parent comment not found: " + req.getParentId());
        }
        Comment comment = Comment.builder()
                .authorId(authorId)
                .postId(postId)
                .content(req.getContent())
                .postVisibility(req.getPostVisibility())
                .parentId(req.getParentId())
                .build();
        Comment saved = commentRepository.save(comment);

        // ── Kafka notification ────────────────────────────────────────────────
        Post parentPost = postRepository.findById(postId).orElse(null);
        if (parentPost != null) {
            String commenterName = userClient.displayName(authorId);
            if (req.getParentId() != null) {
                // Reply: notify the parent comment author
                commentRepository.findById(req.getParentId()).ifPresent(parentComment -> {
                    if (!parentComment.getAuthorId().equals(authorId)) {
                        notificationPublisher.publish(NotificationEvent.builder()
                                .recipientId(parentComment.getAuthorId())
                                .senderId(authorId)
                                .notificationType("COMMENT")
                                .title(commenterName + " replied to your comment")
                                .body(saved.getContent())
                                .resourceId(postId)
                                .resourceType("POST")
                                .build());
                    }
                });
            } else if (!parentPost.getAuthorId().equals(authorId)) {
                // Top-level comment: notify post author
                notificationPublisher.publish(NotificationEvent.builder()
                        .recipientId(parentPost.getAuthorId())
                        .senderId(authorId)
                        .notificationType("COMMENT")
                        .title(commenterName + " commented on your post")
                        .body(saved.getContent())
                        .resourceId(postId)
                        .resourceType("POST")
                        .build());
            }
        }

        String commenterName = userClient.displayName(authorId);
        String commentAddedDesc;
        if (req.getParentId() != null) {
            // reply: resolve the parent comment's author
            String parentAuthorName = commentRepository.findById(req.getParentId())
                    .map(pc -> userClient.displayName(pc.getAuthorId()))
                    .orElse("another user");
            commentAddedDesc = commenterName + " replied to a comment by " + parentAuthorName;
        } else {
            // top-level comment: resolve the post author
            String postAuthorName = postRepository.findById(postId)
                    .map(p -> userClient.displayName(p.getAuthorId()))
                    .orElse("another user");
            commentAddedDesc = commenterName + " commented on a post by " + postAuthorName;
        }
        auditClient.log(authorId, saved.getId(), "COMMENT", PostAuditAction.COMMENT_ADDED,
                commentAddedDesc,
                true, null, saved.getContent());

        return toResponse(saved);
    }

    public Page<CommentResponse> getTopLevelComments(String postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        return commentRepository.findByPostIdAndParentIdIsNull(postId, pageable)
                .map(this::toResponse);
    }

    /**
     * Returns all direct replies to a given comment, sorted oldest-first.
     * Replies can themselves have replies (infinitely nested) — the client
     * decides how deep to recurse.
     */
    public Page<CommentResponse> getReplies(String commentId, int page, int size) {
        if (!commentRepository.existsById(commentId)) {
            throw new IllegalArgumentException("Comment not found: " + commentId);
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        return commentRepository.findByParentId(commentId, pageable)
                .map(this::toResponse);
    }

    /**
     * Updates a comment if the requester is authorised:
     * <ul>
     *   <li><b>Owner</b> – always allowed to edit their own comment.</li>
     *   <li><b>Team leader</b> – allowed when the parent post belongs to their team.</li>
     *   <li><b>Department leader/manager</b> – allowed when the parent post belongs to
     *       their department, OR when the post belongs to a team inside their department.</li>
     * </ul>
     *
     * @param roles Spring Security role names (without the "ROLE_" prefix).
     */
    public CommentResponse updateComment(String commentId, CommentRequest req,
                                         String requesterId, List<String> roles) {
        Comment comment = findComment(commentId);
        assertCanEdit(comment, requesterId, roles);

        String oldContent = comment.getContent();

        comment.setContent(req.getContent());
        comment.setEdited(true);
        comment.setUpdatedAt(LocalDateTime.now());
        Comment saved = commentRepository.save(comment);

        String updaterName = userClient.displayName(requesterId);
        boolean isCommentOwner = comment.getAuthorId().equals(requesterId);
        String updateCommentDesc = isCommentOwner
                ? updaterName + " edited their own comment"
                : updaterName + " edited a comment by " + userClient.displayName(comment.getAuthorId()) + " (moderator action)";
        auditClient.log(requesterId, commentId, "COMMENT", PostAuditAction.COMMENT_UPDATED,
                updateCommentDesc,
                true, oldContent, saved.getContent());

        return toResponse(saved);
    }

    public void deleteComment(String commentId, String requesterId) {
        Comment comment = findComment(commentId);
        assertOwner(comment.getAuthorId(), requesterId);

        String postId = comment.getPostId();

        // Cascade-delete all nested replies
        deleteRepliesRecursively(commentId);
        reactionRepository.deleteByReactableTypeAndReactableId("COMMENT", commentId);
        commentRepository.delete(comment);

        String deleterNameC = userClient.displayName(requesterId);
        String commentOwnerName = userClient.displayName(comment.getAuthorId());
        boolean deletingOwn = comment.getAuthorId().equals(requesterId);
        String deleteCommentDesc = deletingOwn
                ? deleterNameC + " deleted their own comment"
                : deleterNameC + " deleted a comment by " + commentOwnerName + " (moderator action)";
        auditClient.log(requesterId, commentId, "COMMENT", PostAuditAction.COMMENT_DELETED,
                deleteCommentDesc,
                true, comment.getContent(), null);
    }

    // ── Authorization ─────────────────────────────────────────────────────────

    /**
     * Resolves edit permission for a comment by delegating context-aware checks
     * to the parent post's team / department metadata.
     */
    private void assertCanEdit(Comment comment, String requesterId, List<String> roles) {
        // 1. Owner
        if (comment.getAuthorId().equals(requesterId)) return;

        boolean isTeamLeader  = roles != null && roles.contains("TEAM_LEADER");
        boolean isDeptManager = roles != null && (
                roles.contains("DEPARTMENT_LEADER") || roles.contains("DEPARTMENT_MANAGER"));
        boolean isCeo         = roles != null && roles.contains("CEO");

        if (isCeo) return;

        // Resolve the parent post to get teamId / departmentId context
        Post parentPost = postRepository.findById(comment.getPostId()).orElse(null);

        if (parentPost != null) {
            // 2. Team leader: comment is on a post that belongs to their team
            if (isTeamLeader && parentPost.getTeamId() != null) {
                if (organizationClient.isTeamLead(parentPost.getTeamId(), requesterId)) return;
            }

            // 3. Department manager: post directly in their dept
            if (isDeptManager && parentPost.getDepartmentId() != null) {
                if (organizationClient.isDepartmentManager(parentPost.getDepartmentId(), requesterId)) return;
            }

            // 3b. Department manager: post in a team inside their dept
            if (isDeptManager && parentPost.getTeamId() != null) {
                String teamDeptId = organizationClient.getDepartmentIdForTeam(parentPost.getTeamId());
                if (teamDeptId != null
                        && organizationClient.isDepartmentManager(teamDeptId, requesterId)) return;
            }
        }

        throw new AccessDeniedException("You are not allowed to edit this comment");
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private CommentResponse toResponse(Comment c) {
        long replyCount = commentRepository.countByParentId(c.getId());
        long reactionCount = reactionRepository.countByReactableTypeAndReactableId("COMMENT", c.getId());
        return CommentResponse.builder()
                .id(c.getId()).authorId(c.getAuthorId()).postId(c.getPostId())
                .content(c.getContent()).postVisibility(c.getPostVisibility())
                .isPinned(c.isPinned()).isEdited(c.isEdited()).parentId(c.getParentId())
                .reactionCount(reactionCount).replyCount(replyCount)
                .createdAt(c.getCreatedAt()).updatedAt(c.getUpdatedAt())
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void deleteRepliesRecursively(String parentCommentId) {
        List<Comment> replies = commentRepository.findAllReplies(parentCommentId);
        for (Comment reply : replies) {
            deleteRepliesRecursively(reply.getId());
            reactionRepository.deleteByReactableTypeAndReactableId("COMMENT", reply.getId());
            commentRepository.delete(reply);
        }
    }

    private Comment findComment(String id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + id));
    }

    private void assertOwner(String ownerId, String requesterId) {
        if (!ownerId.equals(requesterId)) {
            throw new AccessDeniedException("You are not allowed to modify this comment");
        }
    }
}
