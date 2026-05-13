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
    private final OrganizationClient organizationClient;

    /* ── Create ───────────────────────────────────────────────────────────── */

    public PostResponse createPost(PostRequest req, String authorId) {
        /*
         * Visibility derivation rules:
         *  - teamId present       → TEAM_ONLY
         *  - departmentId present → DEPARTMENT_ONLY
         *  - Otherwise            → client-supplied value (PUBLIC / PRIVATE)
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

    /** Global public feed (no follow filtering). */
    public Page<PostResponse> getPublicFeed(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository
                .findByPostVisibilityIn(List.of(VisibilityType.PUBLIC), pageable)
                .map(this::toResponse);
    }

    /**
     * Personalised feed for the authenticated user.
     *
     * <p>Rules:</p>
     * <ul>
     *   <li>Fetches explicit follows <em>and</em> implicit membership from
     *       Organization-Service in a single HTTP call.</li>
     *   <li>A user automatically sees posts from:
     *     <ol>
     *       <li>Departments they explicitly follow.</li>
     *       <li>Teams they explicitly follow.</li>
     *       <li>Teams they are a <strong>member</strong> of (joined / assigned).</li>
     *       <li>Departments that contain a team they are a member of —
     *           even if the user never pressed "follow" on that department.</li>
     *     </ol>
     *   </li>
     *   <li>Visibility rules: PUBLIC, DEPARTMENT_ONLY, and TEAM_ONLY posts are
     *       included; PRIVATE posts are never surfaced.</li>
     *   <li>If the user has no follows and no memberships, returns an empty page.</li>
     * </ul>
     *
     * @param userId the authenticated user's ID (extracted from JWT by the controller)
     * @param page   zero-based page index
     * @param size   maximum items per page
     */
    public Page<PostResponse> getFollowingFeed(String userId, int page, int size) {
        // 1. Resolve follows + memberships (single HTTP call to org-service)
        OrganizationClient.UserFollows follows = organizationClient.getUserFollows();

        // 2. Merge explicit follows with implicit membership — deduplicate in stream
        List<String> allDeptIds = Stream.concat(
                        follows.departmentIds().stream(),
                        follows.memberDepartmentIds().stream())
                .distinct()
                .toList();

        List<String> allTeamIds = Stream.concat(
                        follows.teamIds().stream(),
                        follows.memberTeamIds().stream())
                .distinct()
                .toList();

        log.debug(
            "Building feed for user={}: followedDepts={}, memberDepts={} → totalDepts={} | "
          + "followedTeams={}, memberTeams={} → totalTeams={}",
            userId,
            follows.departmentIds().size(), follows.memberDepartmentIds().size(), allDeptIds.size(),
            follows.teamIds().size(),       follows.memberTeamIds().size(),       allTeamIds.size());

        // 3. Nothing to show → return empty page immediately
        if (allDeptIds.isEmpty() && allTeamIds.isEmpty()) {
            return Page.empty(PageRequest.of(page, size));
        }

        // 4. Query MongoDB for posts belonging to any of the resolved departments OR teams
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        List<VisibilityType> allowedVisibilities = List.of(
                VisibilityType.PUBLIC,
                VisibilityType.DEPARTMENT_ONLY,
                VisibilityType.TEAM_ONLY
        );

        // Guard: MongoDB $in: [] matches nothing, which is what we want —
        // but we use a sentinel to keep the query intent explicit.
        List<String> deptIds = allDeptIds.isEmpty() ? List.of("__no_dept__") : allDeptIds;
        List<String> teamIds = allTeamIds.isEmpty() ? List.of("__no_team__") : allTeamIds;

        return postRepository
                .findFollowingFeed(deptIds, teamIds, allowedVisibilities, pageable)
                .map(this::toResponse);
    }

    public Page<PostResponse> getByAuthor(String authorId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository.findByAuthorId(authorId, pageable).map(this::toResponse);
    }

    /**
     * Returns all posts for a team: TEAM_ONLY and PUBLIC posts linked to this team.
     */
    public Page<PostResponse> getByTeam(String teamId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository
                .findByTeamIdAndPostVisibilityIn(teamId,
                        List.of(VisibilityType.PUBLIC, VisibilityType.TEAM_ONLY), pageable)
                .map(this::toResponse);
    }

    /**
     * Returns all posts for a department: DEPARTMENT_ONLY and PUBLIC posts linked
     * to this department.
     */
    public Page<PostResponse> getByDepartment(String departmentId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository
                .findByDepartmentIdAndPostVisibilityIn(departmentId,
                        List.of(VisibilityType.PUBLIC, VisibilityType.DEPARTMENT_ONLY), pageable)
                .map(this::toResponse);
    }

    /* ── Update ───────────────────────────────────────────────────────────── */

    public PostResponse updatePost(String postId, PostRequest req, String requesterId, List<String> roles) {
        Post post = findPost(postId);
        assertCanEdit(post, requesterId, roles, "edit");

        post.setContent(req.getContent());
        post.setPostType(req.getPostType());
        PostRequest contextualReq = buildContextualRequest(req, post);
        post.setPostVisibility(resolveVisibility(contextualReq));
        post.setPinned(req.isPinned());
        post.setUpdatedBy(requesterId);
        post.setUpdatedAt(LocalDateTime.now());
        return toResponse(postRepository.save(post));
    }

    /* ── Delete ───────────────────────────────────────────────────────────── */

    @Transactional
    public void deletePost(String postId, String requesterId, List<String> roles) {
        Post post = findPost(postId);
        assertCanEdit(post, requesterId, roles, "delete");

        commentRepository.deleteByPostId(postId);
        attachmentRepository.deleteByPostId(postId);
        reactionRepository.deleteByReactableTypeAndReactableId("POST", postId);
        postRepository.delete(post);
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
        if (req.getTeamId() != null && !req.getTeamId().isBlank()) {
            return VisibilityType.TEAM_ONLY;
        }
        if (req.getDepartmentId() != null && !req.getDepartmentId().isBlank()) {
            return VisibilityType.DEPARTMENT_ONLY;
        }
        return req.getPostVisibility() != null ? req.getPostVisibility() : VisibilityType.PUBLIC;
    }

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