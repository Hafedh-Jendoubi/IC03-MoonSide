package tn.moonside.postservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.moonside.postservice.dtos.responses.ApiResponse;
import tn.moonside.postservice.dtos.responses.PostResponse;
import tn.moonside.postservice.services.SavedPostService;

import java.util.List;

@RestController
@RequestMapping("/posts/saved")
@RequiredArgsConstructor
public class SavedPostController {

    private final SavedPostService savedPostService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PostResponse>>> getSaved(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(savedPostService.getSavedPosts(userId)));
    }

    @PostMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> save(
            @PathVariable String postId,
            @AuthenticationPrincipal String userId) {
        savedPostService.save(postId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Post saved"));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> unsave(
            @PathVariable String postId,
            @AuthenticationPrincipal String userId) {
        savedPostService.unsave(postId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Post unsaved"));
    }
}
