package tn.moonside.organizationservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.moonside.organizationservice.dtos.responses.ApiResponse;
import tn.moonside.organizationservice.dtos.responses.UserFollowsResponse;
import tn.moonside.organizationservice.services.FollowService;

/**
 * Exposes the current user's own follow list so that Post-Service
 * (and any other consumer) can build a personalised feed.
 *
 * Base path: /organizations/follows
 */
@RestController
@RequestMapping("/organizations/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    /**
     * GET /organizations/follows/mine
     *
     * Returns two lists:
     *  • followedDepartmentIds – IDs of departments the caller follows
     *  • followedTeamIds       – IDs of teams the caller follows
     *
     * Used by Post-Service's /posts/feed/following endpoint.
     */
    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<UserFollowsResponse>> getMyFollows(
            @AuthenticationPrincipal String userId) {

        return ResponseEntity.ok(
                ApiResponse.success(followService.getUserFollows(userId))
        );
    }
}
