package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.moonside.postservice.clients.OrganizationClient;
import tn.moonside.postservice.dtos.requests.PostRequest;
import tn.moonside.postservice.dtos.responses.*;
import tn.moonside.postservice.entities.*;
import tn.moonside.postservice.enums.VisibilityType;
import tn.moonside.postservice.repositories.*;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final ReactionRepository reactionRepository;
    private final ReactionTypeRepository reactionTypeRepository;
    private final OrganizationClient organizationClient;

    /* ── Create ───────────────────────────────────────────────────────────── */

    public PostResponse createPost(PostRequest req, String authorId) {
        /*
         * Visibility derivation rules:
         *  - If the post is created inside a team feed  → TEAM_ONLY
         *  - If the post is created inside a department feed → DEPARTMENT_ONLY
         *  - Otherwise the client-supplied value (PUBLIC or PRIVATE) is used.
         *
         * This means clients only ever submit PUBLIC or PRIVATE; the server
         * automatically upgrades the visibility when a context id is present.
         */
        VisibilityType resolvedVisibility = resolveVisibility(req);

        Post post = Post.builder()
                .authorId(authorId)
                .teamId(req.getTeamId())
                .departmentId(req.getDepartmentId())
                .content(req.getContent())
                .postType(req.getPostType())
                .postVisibility(resolvedVisibility)
                .isPinned(req.isPinned())
                .isAIGenerated(req.isAIGenerated())
                .build();
        return toResponse(postRepository.save(post));
    }

    /* ── Read ─────────────────────────────────────────────────────────────── */

    public PostResponse getById(String postId) {
        Post post = findPost(postId);
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);
        return toResponse(post);
    }

    public Page<PostResponse> getPublicFeed(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository
                .findByPostVisibilityIn(List.of(VisibilityType.PUBLIC), pageable)
                .map(this::toResponse);
    }

    public Page<PostResponse> getByAuthor(String authorId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository.findByAuthorId(authorId, pageable).map(this::toResponse);
    }

    /**
     * Returns all posts for a team: both TEAM_ONLY posts and PUBLIC posts
     * that were linked to this team.
     */
    public Page<PostResponse> getByTeam(String teamId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository
                .findByTeamIdAndPostVisibilityIn(teamId,
                        List.of(VisibilityType.PUBLIC, VisibilityType.TEAM_ONLY), pageable)
                .map(this::toResponse);
    }

    /**
     * Returns all posts for a department: both DEPARTMENT_ONLY posts and PUBLIC
     * posts that were linked to this department.
     */
    public Page<PostResponse> getByDepartment(String departmentId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository
                .findByDepartmentIdAndPostVisibilityIn(departmentId,
                        List.of(VisibilityType.PUBLIC, VisibilityType.DEPARTMENT_ONLY), pageable)
                .map(this::toResponse);
    }

    /* ── Update ───────────────────────────────────────────────────────────── */

    /**
     * Updates a post if the requester is authorised:
     * <ul>
     *   <li><b>Owner</b> – always allowed to edit their own post.</li>
     *   <li><b>Team leader</b> – allowed when the post belongs to their team.</li>
     *   <li><b>Department leader/manager</b> – allowed when the post belongs to
     *       their department, OR when the post belongs to a team that is inside
     *       their department.</li>
     * </ul>
     *
     * @param roles Spring Security role names (without the "ROLE_" prefix) taken
     *              from the JWT, e.g. ["EMPLOYEE", "TEAM_LEADER"].
     */
    public PostResponse updatePost(String postId, PostRequest req, String requesterId, List<String> roles) {
        Post post = findPost(postId);
        assertCanEdit(post, requesterId, roles, "edit");

        post.setContent(req.getContent());
        post.setPostType(req.getPostType());
        // Re-derive visibility on update as well (context ids on the existing post are preserved)
        PostRequest contextualReq = buildContextualRequest(req, post);
        post.setPostVisibility(resolveVisibility(contextualReq));
        post.setPinned(req.isPinned());
        post.setUpdatedBy(requesterId);
        post.setUpdatedAt(LocalDateTime.now());
        return toResponse(postRepository.save(post));
    }

    /* ── Delete ───────────────────────────────────────────────────────────── */

    @Transactional
    public void deletePost(String postId, String requesterId) {
        Post post = findPost(postId);
        assertOwner(post.getAuthorId(), requesterId, "delete");

        commentRepository.deleteByPostId(postId);
        attachmentRepository.deleteByPostId(postId);
        reactionRepository.deleteByReactableTypeAndReactableId("POST", postId);
        postRepository.delete(post);
    }

    /* ── Authorization ────────────────────────────────────────────────────── */

    /**
     * Checks edit permission in order of specificity:
     * 1. Owner of the post
     * 2. Team leader of the team the post belongs to
     * 3. Department leader/manager of the department the post belongs to
     *    (directly OR via a team inside that department)
     *
     * Throws {@link AccessDeniedException} if none of the conditions are met.
     */
    private void assertCanEdit(Post post, String requesterId, List<String> roles, String action) {
        // 1. Owner
        if (post.getAuthorId().equals(requesterId)) return;

        boolean isTeamLeader  = roles != null && roles.contains("TEAM_LEADER");
        boolean isDeptManager = roles != null && (
                roles.contains("DEPARTMENT_LEADER") || roles.contains("DEPARTMENT_MANAGER"));
        boolean isCeo         = roles != null && roles.contains("CEO");

        // CEO can do anything
        if (isCeo) return;

        // 2. Team leader: post must belong to their team
        if (isTeamLeader && post.getTeamId() != null) {
            if (organizationClient.isTeamLead(post.getTeamId(), requesterId)) return;
        }

        // 3. Department manager: post directly in their dept
        if (isDeptManager && post.getDepartmentId() != null) {
            if (organizationClient.isDepartmentManager(post.getDepartmentId(), requesterId)) return;
        }

        // 3b. Department manager: post in a team that belongs to their dept
        if (isDeptManager && post.getTeamId() != null) {
            String teamDeptId = organizationClient.getDepartmentIdForTeam(post.getTeamId());
            if (teamDeptId != null
                    && organizationClient.isDepartmentManager(teamDeptId, requesterId)) return;
        }

        throw new AccessDeniedException("You are not allowed to " + action + " this post");
    }

    /* ── Visibility derivation ────────────────────────────────────────────── */

    /**
     * Derives the stored visibility from request context:
     * <ul>
     *   <li>teamId present → {@code TEAM_ONLY}</li>
     *   <li>departmentId present (no teamId) → {@code DEPARTMENT_ONLY}</li>
     *   <li>Otherwise → use whatever the client sent (PUBLIC or PRIVATE)</li>
     * </ul>
     */
    private VisibilityType resolveVisibility(PostRequest req) {
        if (req.getTeamId() != null && !req.getTeamId().isBlank()) {
            return VisibilityType.TEAM_ONLY;
        }
        if (req.getDepartmentId() != null && !req.getDepartmentId().isBlank()) {
            return VisibilityType.DEPARTMENT_ONLY;
        }
        // Default to PUBLIC if client sent nothing
        return req.getPostVisibility() != null ? req.getPostVisibility() : VisibilityType.PUBLIC;
    }

    /**
     * When updating, preserve the teamId / departmentId from the stored post
     * so visibility is re-derived correctly even if the client omits them.
     */
    private PostRequest buildContextualRequest(PostRequest req, Post existingPost) {
        if (req.getTeamId() == null) req.setTeamId(existingPost.getTeamId());
        if (req.getDepartmentId() == null) req.setDepartmentId(existingPost.getDepartmentId());
        return req;
    }

    /* ── Mapping ──────────────────────────────────────────────────────────── */

    private PostResponse toResponse(Post post) {
        List<AttachmentResponse> attachments = attachmentRepository.findByPostId(post.getId())
                .stream().map(this::toAttachmentResponse).toList();

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

    private void assertOwner(String ownerId, String requesterId, String action) {
        if (!ownerId.equals(requesterId)) {
            throw new AccessDeniedException("You are not allowed to " + action + " this post");
        }
    }
}
