package tn.moonside.postservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.moonside.postservice.dtos.responses.ApiResponse;
import tn.moonside.postservice.dtos.responses.CommentResponse;
import tn.moonside.postservice.dtos.responses.ReactionResponse;
import tn.moonside.postservice.services.CommentService;
import tn.moonside.postservice.services.ReactionService;

/**
 * Read-only endpoints that return a single user's content across every post —
 * used by the "Recent Activity" section on a user's profile page. Unlike the
 * per-post comment/reaction endpoints, these are not scoped to a specific post.
 */
@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class UserContentController {

    private final CommentService commentService;
    private final ReactionService reactionService;

    /**
     * GET /posts/comments/author/{authorId}
     * Every comment authored by this user, across all posts, newest first.
     */
    @GetMapping("/comments/author/{authorId}")
    public ResponseEntity<ApiResponse<Page<CommentResponse>>> getCommentsByAuthor(
            @PathVariable String authorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(commentService.getByAuthor(authorId, page, size)));
    }

    /**
     * GET /posts/reactions/user/{userId}
     * Every reaction (to posts and comments) made by this user, newest first.
     */
    @GetMapping("/reactions/user/{userId}")
    public ResponseEntity<ApiResponse<Page<ReactionResponse>>> getReactionsByUser(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(reactionService.getByUser(userId, page, size)));
    }
}
