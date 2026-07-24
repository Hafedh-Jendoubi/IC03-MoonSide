package tn.moonside.postservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.moonside.postservice.dtos.responses.ApiResponse;
import tn.moonside.postservice.dtos.responses.PostStatsResponse;
import tn.moonside.postservice.services.PostStatsService;

/**
 * Admin back-office statistics for posts, comments, and reactions.
 * Restricted to CEO and HUMAN_RESOURCES (back-office roles).
 */
@RestController
@RequestMapping("/posts/stats")
@RequiredArgsConstructor
public class PostStatsController {

    private final PostStatsService postStatsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CEO', 'HUMAN_RESOURCES')")
    public ResponseEntity<ApiResponse<PostStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(postStatsService.getStats(), "Post stats retrieved"));
    }
}
