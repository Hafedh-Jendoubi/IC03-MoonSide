package tn.moonside.organizationservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.moonside.organizationservice.dtos.responses.ApiResponse;
import tn.moonside.organizationservice.dtos.responses.OrgStatsResponse;
import tn.moonside.organizationservice.services.OrgStatsService;

/**
 * Admin back-office statistics for departments, teams, and projects.
 * Restricted to CEO and HUMAN_RESOURCES (back-office roles).
 */
@RestController
@RequestMapping("/organizations/stats")
@RequiredArgsConstructor
public class OrgStatsController {

    private final OrgStatsService orgStatsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CEO', 'HUMAN_RESOURCES')")
    public ResponseEntity<ApiResponse<OrgStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(orgStatsService.getStats(), "Organization stats retrieved"));
    }
}
