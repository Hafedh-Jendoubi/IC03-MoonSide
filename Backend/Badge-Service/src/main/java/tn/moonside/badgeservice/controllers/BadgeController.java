package tn.moonside.badgeservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.moonside.badgeservice.dtos.ApiResponse;
import tn.moonside.badgeservice.dtos.BadgeDefinitionResponse;
import tn.moonside.badgeservice.dtos.UserBadgeResponse;
import tn.moonside.badgeservice.services.BadgeService;

import java.util.List;

@RestController
@RequestMapping("/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    /**
     * Public badge catalogue — every badge with metadata and full holder list.
     * Accessible to any authenticated user; used by the /badges page.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BadgeDefinitionResponse>>> getAllBadges() {
        return ResponseEntity.ok(ApiResponse.success(badgeService.getAllBadgesWithHolders()));
    }

    /**
     * Returns the full badge catalogue annotated with whether the calling user
     * has earned each badge.  Used to render the "My Badges" profile section.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<BadgeDefinitionResponse>>> getMyBadges(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(badgeService.getAllBadgeDefinitions(userId)));
    }

    /**
     * Returns only the badges that the calling user has earned, with award timestamps.
     */
    @GetMapping("/me/earned")
    public ResponseEntity<ApiResponse<List<UserBadgeResponse>>> getMyEarnedBadges(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(badgeService.getEarnedBadges(userId)));
    }

    /**
     * Returns earned badges for any user by ID.
     * Used on public profile pages.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<UserBadgeResponse>>> getUserBadges(
            @PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success(badgeService.getEarnedBadges(userId)));
    }
}
