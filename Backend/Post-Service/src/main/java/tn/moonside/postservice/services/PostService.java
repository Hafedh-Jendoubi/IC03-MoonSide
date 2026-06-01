package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.moonside.postservice.audit.AuditClient;
import tn.moonside.postservice.audit.PostAuditAction;
import tn.moonside.postservice.clients.OrganizationClient;
import tn.moonside.postservice.clients.UserClient;
import tn.moonside.postservice.dtos.requests.PostRequest;
import tn.moonside.postservice.dtos.responses.*;
import tn.moonside.postservice.entities.*;
import tn.moonside.postservice.enums.TypePosts;
import tn.moonside.postservice.enums.VisibilityType;
import tn.moonside.postservice.repositories.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final ReactionRepository reactionRepository;
    private final ReactionTypeRepository reactionTypeRepository;
    private final SurveyVoteRepository surveyVoteRepository;
    private final OrganizationClient organizationClient;
    private final SurveyService surveyService;
    private final AuditClient auditClient;
    private final UserClient userClient;

    /* ── Create ───────────────────────────────────────────────────────────── */

    public PostResponse createPost(PostRequest req, String authorId) {
        // ── Membership guard ───────────────────────────────────────────────────
        // A user may only post into a team or department they actually belong to.
        // CEO is exempt. The check is fail-open: if org-service is unreachable we
        // let the post through rather than blocking the entire create path.
        if (req.getTeamId() != null && !req.getTeamId().isBlank()) {
            boolean isLead   = organizationClient.isTeamLead(req.getTeamId(), authorId);
            boolean isMember = organizationClient.isTeamMember(req.getTeamId(), authorId);
            boolean isCeo    = organizationClient.hasRole(authorId, "CEO");
            if (!isLead && !isMember && !isCeo) {
                throw new AccessDeniedException(
                        "You must be a member of this team to post here.");
            }
        }
        if (req.getDepartmentId() != null && !req.getDepartmentId().isBlank()) {
            boolean isDeptManager = organizationClient.isDepartmentManager(req.getDepartmentId(), authorId);
            boolean isDeptMember  = organizationClient.isDepartmentMember(req.getDepartmentId(), authorId);
            boolean isCeo         = organizationClient.hasRole(authorId, "CEO");
            if (!isDeptManager && !isDeptMember && !isCeo) {
                throw new AccessDeniedException(
                        "You must be a member of this department to post here.");
            }
        }

        VisibilityType resolvedVisibility = resolveVisibility(req);

        Post.PostBuilder builder = Post.builder()
                .authorId(authorId)
                .teamId(req.getTeamId())
                .departmentId(req.getDepartmentId())
                .content(req.getContent() != null ? req.getContent() : "")
                .postType(req.getPostType())
                .postVisibility(resolvedVisibility)
                .isPinned(req.isPinned())
                .isAIGenerated(req.isAIGenerated());

        if (req.getPostType() == TypePosts.SURVEY) {
            if (req.getSurveyQuestion() == null || req.getSurveyQuestion().isBlank()) {
                throw new IllegalArgumentException("Survey question is required");
            }
            if (req.getSurveyOptions() == null || req.getSurveyOptions().size() < 2) {
                throw new IllegalArgumentException("Survey must have at least 2 options");
            }
            if (req.getSurveyOptions().size() > 10) {
                throw new IllegalArgumentException("Survey can have at most 10 options");
            }
            builder.surveyQuestion(req.getSurveyQuestion())
                   .surveyOptions(surveyService.buildOptions(req.getSurveyOptions()))
                   .surveyOpen(true);
        }

        Post saved = postRepository.save(builder.build());

        String authorName = userClient.displayName(authorId);
        String postCreatedDesc = "Post created by " + authorName +
                " with visibility '" + resolvedVisibility + "'" +
                (req.getTeamId() != null ? " in a team" : "") +
                (req.getDepartmentId() != null ? " in a department" : "");
        auditClient.log(authorId, saved.getId(), "POST", PostAuditAction.POST_CREATED,
                postCreatedDesc,
                true, null, toJson(saved));

        return toResponse(saved, authorId);
    }

    /* ── Read ─────────────────────────────────────────────────────────────── */

    public PostResponse getById(String postId) {
        Post post = findPost(postId);
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);
        String requesterId = currentUserId();
        return toResponse(post, requesterId);
    }

    public Page<PostResponse> getPublicFeed(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String requesterId = currentUserId();
        return postRepository
                .findByPostVisibilityIn(List.of(VisibilityType.PUBLIC), pageable)
                .map(p -> toResponse(p, requesterId));
    }

    public Page<PostResponse> getFollowingFeed(String userId, int page, int size) {
        OrganizationClient.UserFollows follows = organizationClient.getUserFollows();

        List<String> allDeptIds = Stream.concat(
                        follows.departmentIds().stream(),
                        follows.memberDepartmentIds().stream())
                .distinct().toList();

        List<String> allTeamIds = Stream.concat(
                        follows.teamIds().stream(),
                        follows.memberTeamIds().stream())
                .distinct().toList();

        if (allDeptIds.isEmpty() && allTeamIds.isEmpty()) {
            return Page.empty(PageRequest.of(page, size));
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<VisibilityType> allowedVisibilities = List.of(
                VisibilityType.PUBLIC, VisibilityType.DEPARTMENT_ONLY, VisibilityType.TEAM_ONLY);

        List<String> deptIds = allDeptIds.isEmpty() ? List.of("__no_dept__") : allDeptIds;
        List<String> teamIds = allTeamIds.isEmpty() ? List.of("__no_team__") : allTeamIds;

        return postRepository
                .findFollowingFeed(deptIds, teamIds, allowedVisibilities, pageable)
                .map(p -> toResponse(p, userId));
    }

    public Page<PostResponse> getByAuthor(String authorId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String requesterId = currentUserId();
        return postRepository.findByAuthorId(authorId, pageable).map(p -> toResponse(p, requesterId));
    }

    public Page<PostResponse> getByTeam(String teamId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "isPinned")
                    .and(Sort.by(Sort.Direction.DESC, "createdAt")));
        String requesterId = currentUserId();
        return postRepository
                .findByTeamIdAndPostVisibilityInSorted(teamId,
                        List.of(VisibilityType.PUBLIC, VisibilityType.TEAM_ONLY), pageable)
                .map(p -> toResponse(p, requesterId));
    }

    public Page<PostResponse> getByDepartment(String departmentId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "isPinned")
                    .and(Sort.by(Sort.Direction.DESC, "createdAt")));
        String requesterId = currentUserId();
        return postRepository
                .findByDepartmentIdAndPostVisibilityInSorted(departmentId,
                        List.of(VisibilityType.PUBLIC, VisibilityType.DEPARTMENT_ONLY), pageable)
                .map(p -> toResponse(p, requesterId));
    }

    /* ── Update ───────────────────────────────────────────────────────────── */

    public PostResponse updatePost(String postId, PostRequest req, String requesterId, List<String> roles) {
        Post post = findPost(postId);
        assertCanEdit(post, requesterId, roles, "edit");

        String oldJson = toJson(post);

        post.setContent(req.getContent() != null ? req.getContent() : post.getContent());
        post.setPostType(req.getPostType());
        PostRequest contextualReq = buildContextualRequest(req, post);
        post.setPostVisibility(resolveVisibility(contextualReq));
        post.setPinned(req.isPinned());
        post.setUpdatedBy(requesterId);
        post.setUpdatedAt(LocalDateTime.now());

        // ── Survey fields ─────────────────────────────────────────────────────
        if (req.getPostType() == TypePosts.SURVEY) {
            if (req.getSurveyQuestion() != null) {
                post.setSurveyQuestion(req.getSurveyQuestion());
            }
            if (req.getSurveyOptions() != null && !req.getSurveyOptions().isEmpty()) {
                List<SurveyOption> existing = post.getSurveyOptions() != null
                        ? post.getSurveyOptions() : new java.util.ArrayList<>();
                List<SurveyOption> updatedOptions = new java.util.ArrayList<>();
                for (int i = 0; i < req.getSurveyOptions().size(); i++) {
                    String text = req.getSurveyOptions().get(i);
                    SurveyOption opt = (i < existing.size()) ? existing.get(i) : new SurveyOption();
                    if (opt.getId() == null) opt.setId(java.util.UUID.randomUUID().toString());
                    opt.setText(text);
                    updatedOptions.add(opt);
                }
                post.setSurveyOptions(updatedOptions);
            }
        }

        Post saved = postRepository.save(post);

        String updaterName = userClient.displayName(requesterId);
        boolean isOwnerUpdating = post.getAuthorId().equals(requesterId);
        String updateDesc = isOwnerUpdating
                ? "Post updated by its author " + updaterName
                : "Post updated by " + updaterName + " (moderator action)";
        auditClient.log(requesterId, postId, "POST", PostAuditAction.POST_UPDATED,
                updateDesc,
                true, oldJson, toJson(saved));

        return toResponse(saved, requesterId);
    }

    /* ── Pin / Unpin ──────────────────────────────────────────────────────── */

    public PostResponse togglePin(String postId, String requesterId, List<String> roles) {
        Post post = findPost(postId);
        assertCanEdit(post, requesterId, roles, "pin/unpin");
        boolean wasPinned = post.isPinned();
        post.setPinned(!wasPinned);
        post.setUpdatedBy(requesterId);
        post.setUpdatedAt(LocalDateTime.now());

        Post saved = postRepository.save(post);

        String action = wasPinned ? PostAuditAction.POST_UNPINNED : PostAuditAction.POST_PINNED;
        String pinnerName = userClient.displayName(requesterId);
        auditClient.log(requesterId, postId, "POST", action,
                "Post " + (wasPinned ? "unpinned" : "pinned") + " by " + pinnerName,
                true, null, null);

        return toResponse(saved, requesterId);
    }

    /* ── Delete ───────────────────────────────────────────────────────────── */

    @Transactional
    public void deletePost(String postId, String requesterId, List<String> roles) {
        Post post = findPost(postId);
        assertCanEdit(post, requesterId, roles, "delete");

        String oldJson = toJson(post);

        commentRepository.deleteByPostId(postId);
        attachmentRepository.deleteByPostId(postId);
        reactionRepository.deleteByReactableTypeAndReactableId("POST", postId);
        surveyVoteRepository.deleteByPostId(postId);
        postRepository.delete(post);

        String deleterName = userClient.displayName(requesterId);
        String postAuthorName = userClient.displayName(post.getAuthorId());
        boolean deletedByOwner = post.getAuthorId().equals(requesterId);
        String deleteDesc = deletedByOwner
                ? "Post deleted by its author " + deleterName +
                  " (originally posted on " + post.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) + ")"
                : "Post by " + postAuthorName + " deleted by moderator " + deleterName +
                  " (originally posted on " + post.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) + ")";
        auditClient.log(requesterId, postId, "POST", PostAuditAction.POST_DELETED,
                deleteDesc,
                true, oldJson, null);
    }

    /* ── Authorization ────────────────────────────────────────────────────── */

    private void assertCanEdit(Post post, String requesterId, List<String> roles, String action) {
        if (post.getAuthorId().equals(requesterId)) return;

        boolean isTeamLeader  = roles != null && roles.contains("TEAM_LEADER");
        boolean isDeptManager = roles != null && (
                roles.contains("DEPARTMENT_LEADER") || roles.contains("DEPARTMENT_MANAGER"));
        boolean isCeo         = roles != null && roles.contains("CEO");

        if (isCeo) return;
        if (isTeamLeader && post.getTeamId() != null) {
            if (organizationClient.isTeamLead(post.getTeamId(), requesterId)) return;
        }
        if (isDeptManager && post.getDepartmentId() != null) {
            if (organizationClient.isDepartmentManager(post.getDepartmentId(), requesterId)) return;
        }
        if (isDeptManager && post.getTeamId() != null) {
            String teamDeptId = organizationClient.getDepartmentIdForTeam(post.getTeamId());
            if (teamDeptId != null
                    && organizationClient.isDepartmentManager(teamDeptId, requesterId)) return;
        }

        throw new AccessDeniedException("You are not allowed to " + action + " this post");
    }

    /* ── Visibility derivation ────────────────────────────────────────────── */

    private VisibilityType resolveVisibility(PostRequest req) {
        if (req.getTeamId() != null && !req.getTeamId().isBlank()) return VisibilityType.TEAM_ONLY;
        if (req.getDepartmentId() != null && !req.getDepartmentId().isBlank()) return VisibilityType.DEPARTMENT_ONLY;
        return req.getPostVisibility() != null ? req.getPostVisibility() : VisibilityType.PUBLIC;
    }

    private PostRequest buildContextualRequest(PostRequest req, Post existingPost) {
        if (req.getTeamId() == null) req.setTeamId(existingPost.getTeamId());
        if (req.getDepartmentId() == null) req.setDepartmentId(existingPost.getDepartmentId());
        return req;
    }

    /* ── Mapping ──────────────────────────────────────────────────────────── */

    private PostResponse toResponse(Post post, String requesterId) {
        List<AttachmentResponse> attachments = attachmentRepository.findByPostId(post.getId())
                .stream().map(this::toAttachmentResponse).toList();

        SurveyResponse survey = null;
        if (post.getPostType() == TypePosts.SURVEY && requesterId != null) {
            survey = surveyService.buildSurveyResponse(post, requesterId);
        }

        return PostResponse.builder()
                .id(post.getId())
                .authorId(post.getAuthorId())
                .teamId(post.getTeamId())
                .departmentId(post.getDepartmentId())
                .updatedBy(post.getUpdatedBy())
                .content(post.getContent())
                .postType(post.getPostType())
                .postVisibility(post.getPostVisibility())
                .isPinned(post.isPinned())
                .isAIGenerated(post.isAIGenerated())
                .viewCount(post.getViewCount())
                .commentCount(commentRepository.countByPostId(post.getId()))
                .reactionCount(reactionRepository.countByReactableTypeAndReactableId("POST", post.getId()))
                .attachments(attachments)
                .survey(survey)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private AttachmentResponse toAttachmentResponse(Attachment a) {
        return AttachmentResponse.builder()
                .id(a.getId()).postId(a.getPostId()).uploaderId(a.getUploaderId())
                .fileName(a.getFileName()).fileURL(a.getFileURL())
                .fileSizeBytes(a.getFileSizeBytes()).uploadedAt(a.getUploadedAt())
                .build();
    }

    /* ── Helpers ──────────────────────────────────────────────────────────── */

    private Post findPost(String postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));
    }

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        return principal instanceof String s ? s : null;
    }

    private String toJson(Post post) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .findAndRegisterModules()
                    .writeValueAsString(post);
        } catch (Exception e) {
            return post.toString();
        }
    }
}
