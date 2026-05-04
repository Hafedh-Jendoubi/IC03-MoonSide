package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import tn.moonside.postservice.dtos.requests.CommentRequest;
import tn.moonside.postservice.dtos.responses.CommentResponse;
import tn.moonside.postservice.entities.Comment;
import tn.moonside.postservice.repositories.CommentRepository;
import tn.moonside.postservice.repositories.PostRepository;
import tn.moonside.postservice.repositories.ReactionRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final ReactionRepository reactionRepository;

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

    public CommentResponse updateComment(String commentId, CommentRequest req, String requesterId) {
        Comment comment = findComment(commentId);
        assertOwner(comment.getAuthorId(), requesterId);
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
