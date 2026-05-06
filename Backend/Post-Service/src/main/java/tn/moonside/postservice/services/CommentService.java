package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import tn.moonside.postservice.clients.OrganizationClient;
import tn.moonside.postservice.dtos.requests.CommentRequest;
import tn.moonside.postservice.dtos.responses.CommentResponse;
import tn.moonside.postservice.entities.Comment;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.repositories.CommentRepository;
import tn.moonside.postservice.repositories.PostRepository;
import tn.moonside.postservice.repositories.ReactionRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final ReactionRepository reactionRepository;
    private final OrganizationClient organizationClient;

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
        return toResponse(commentRepository.save(comment));
    }

    public Page<CommentResponse> getTopLevelComments(String postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        return commentRepository.findByPostIdAndParentIdIsNull(postId, pageable)
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
        comment.setContent(req.getContent());
        comment.setEdited(true);
        comment.setUpdatedAt(LocalDateTime.now());
        return toResponse(commentRepository.save(comment));
    }

    public void deleteComment(String commentId, String requesterId) {
        Comment comment = findComment(commentId);
        assertOwner(comment.getAuthorId(), requesterId);
        reactionRepository.deleteByReactableTypeAndReactableId("COMMENT", commentId);
        commentRepository.delete(comment);
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
        long replyCount = commentRepository.findByParentId(c.getId()).size();
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
