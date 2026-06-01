package tn.moonside.postservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.moonside.postservice.dtos.requests.ReactionRequest;
import tn.moonside.postservice.dtos.responses.ApiResponse;
import tn.moonside.postservice.dtos.responses.ReactionResponse;
import tn.moonside.postservice.dtos.responses.ReactionSummaryResponse;
import tn.moonside.postservice.services.ReactionService;

@RestController
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    /* ── Post reactions ──────────────────────────────────────────────────── */

    @PostMapping("/posts/{postId}/reactions")
    public ResponseEntity<ApiResponse<ReactionResponse>> reactToPost(
            @PathVariable String postId,
            @Valid @RequestBody ReactionRequest req,
            @AuthenticationPrincipal String userId) {
        ReactionResponse result = reactionService.toggleReaction("POST", postId, req, userId);
        String msg = (result == null) ? "Reaction removed" : "Reaction added";
        return ResponseEntity.ok(ApiResponse.success(result, msg));
    }

    @GetMapping("/posts/{postId}/reactions")
    public ResponseEntity<ApiResponse<ReactionSummaryResponse>> getPostReactions(
            @PathVariable String postId,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(reactionService.getSummary("POST", postId, userId)));
    }

    @GetMapping("/posts/{postId}/reactions/users")
    public ResponseEntity<ApiResponse<java.util.List<ReactionResponse>>> getPostReactors(
            @PathVariable String postId) {
        return ResponseEntity.ok(ApiResponse.success(reactionService.getReactors("POST", postId)));
    }

    /* ── Comment reactions ───────────────────────────────────────────────── */

    @PostMapping("/posts/{postId}/comments/{commentId}/reactions")
    public ResponseEntity<ApiResponse<ReactionResponse>> reactToComment(
            @PathVariable String postId,
            @PathVariable String commentId,
            @Valid @RequestBody ReactionRequest req,
            @AuthenticationPrincipal String userId) {
        ReactionResponse result = reactionService.toggleReaction("COMMENT", commentId, req, userId);
        String msg = (result == null) ? "Reaction removed" : "Reaction added";
        return ResponseEntity.ok(ApiResponse.success(result, msg));
    }

    @GetMapping("/posts/{postId}/comments/{commentId}/reactions")
    public ResponseEntity<ApiResponse<ReactionSummaryResponse>> getCommentReactions(
            @PathVariable String postId,
            @PathVariable String commentId,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(reactionService.getSummary("COMMENT", commentId, userId)));
    }

    @GetMapping("/posts/{postId}/comments/{commentId}/reactions/users")
    public ResponseEntity<ApiResponse<java.util.List<ReactionResponse>>> getCommentReactors(
            @PathVariable String postId,
            @PathVariable String commentId) {
        return ResponseEntity.ok(ApiResponse.success(reactionService.getReactors("COMMENT", commentId)));
    }
}
