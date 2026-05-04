package tn.moonside.postservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.moonside.postservice.dtos.requests.PostRequest;
import tn.moonside.postservice.dtos.responses.ApiResponse;
import tn.moonside.postservice.dtos.responses.PostResponse;
import tn.moonside.postservice.services.PostService;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @Valid @RequestBody PostRequest req,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(postService.createPost(req, userId), "Post created"));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(@PathVariable String postId) {
        return ResponseEntity.ok(ApiResponse.success(postService.getById(postId)));
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(postService.getPublicFeed(page, size)));
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getByAuthor(
            @PathVariable String authorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(postService.getByAuthor(authorId, page, size)));
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getByTeam(
            @PathVariable String teamId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(postService.getByTeam(teamId, page, size)));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getByDepartment(
            @PathVariable String departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(postService.getByDepartment(departmentId, page, size)));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable String postId,
            @Valid @RequestBody PostRequest req,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(postService.updatePost(postId, req, userId)));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable String postId,
            @AuthenticationPrincipal String userId) {
        postService.deletePost(postId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Post deleted"));
    }
}
