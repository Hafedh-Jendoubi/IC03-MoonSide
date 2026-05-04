package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    /* ── Create ───────────────────────────────────────────────────────────── */

    public PostResponse createPost(PostRequest req, String authorId) {
        Post post = Post.builder()
                .authorId(authorId)
                .teamId(req.getTeamId())
                .departmentId(req.getDepartmentId())
                .content(req.getContent())
                .postType(req.getPostType())
                .postVisibility(req.getPostVisibility())
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

    public Page<PostResponse> getByTeam(String teamId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository
                .findByTeamIdAndPostVisibilityIn(teamId,
                        List.of(VisibilityType.PUBLIC, VisibilityType.TEAM_ONLY), pageable)
                .map(this::toResponse);
    }

    public Page<PostResponse> getByDepartment(String departmentId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return postRepository
                .findByDepartmentIdAndPostVisibilityIn(departmentId,
                        List.of(VisibilityType.PUBLIC, VisibilityType.DEPARTMENT_ONLY), pageable)
                .map(this::toResponse);
    }

    /* ── Update ───────────────────────────────────────────────────────────── */

    public PostResponse updatePost(String postId, PostRequest req, String requesterId) {
        Post post = findPost(postId);
        assertOwner(post.getAuthorId(), requesterId, "edit");

        post.setContent(req.getContent());
        post.setPostType(req.getPostType());
        post.setPostVisibility(req.getPostVisibility());
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
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not allowed to " + action + " this post");
        }
    }
}
