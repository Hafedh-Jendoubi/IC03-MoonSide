package tn.moonside.organizationservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import tn.moonside.organizationservice.dtos.requests.AssignLeadRequest;
import tn.moonside.organizationservice.dtos.requests.TeamRequest;
import tn.moonside.organizationservice.dtos.requests.UpdateImagesRequest;
import tn.moonside.organizationservice.dtos.responses.ApiResponse;
import tn.moonside.organizationservice.dtos.responses.TeamResponse;
import tn.moonside.organizationservice.dtos.responses.UserTeamResponse;
import tn.moonside.organizationservice.services.TeamService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/organizations/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    // ── Public / authenticated reads ─────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getAllTeams(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getAllTeams(userId)));
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getPublicTeams(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getPublicTeams(userId)));
    }

    /**
     * GET /organizations/teams/visible
     * Returns all teams the authenticated user is allowed to see:
     *  - All PUBLIC teams
     *  - PRIVATE teams where they are a member, team leader, department leader, or CEO
     * This is the correct endpoint for the front-office "Discover" tab.
     */
    @GetMapping("/visible")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getVisibleTeams(
            @AuthenticationPrincipal String userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<String> roles = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(teamService.getVisibleTeams(userId, roles)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> searchTeams(
            @RequestParam String q,
            @AuthenticationPrincipal String userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<String> roles = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(teamService.searchTeams(q, userId, roles)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getMyTeams(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getMyTeams(userId)));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getByDepartment(
            @PathVariable String departmentId,
            @AuthenticationPrincipal String userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<String> roles = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(
                teamService.getTeamsByDepartment(departmentId, userId, roles)));
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<ApiResponse<TeamResponse>> getTeamById(
            @PathVariable String teamId,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamById(teamId, userId)));
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<ApiResponse<List<UserTeamResponse>>> getTeamMembers(
            @PathVariable String teamId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamMembers(teamId)));
    }

    // ── Self-service membership ───────────────────────────────────────────────

    @PostMapping("/{teamId}/join")
    public ResponseEntity<ApiResponse<TeamResponse>> joinTeam(
            @PathVariable String teamId,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(
                teamService.joinTeam(teamId, userId), "Successfully joined the team"));
    }

    @DeleteMapping("/{teamId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveTeam(
            @PathVariable String teamId,
            @AuthenticationPrincipal String userId) {
        teamService.leaveTeam(teamId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Successfully left the team"));
    }

    // ── Admin mutations ───────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<TeamResponse>> createTeam(
            @Valid @RequestBody TeamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(teamService.createTeam(request), "Team created successfully"));
    }

    @PutMapping("/{teamId}")
    public ResponseEntity<ApiResponse<TeamResponse>> updateTeam(
            @PathVariable String teamId,
            @Valid @RequestBody TeamRequest request,
            @AuthenticationPrincipal String userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<String> roles = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(
                teamService.updateTeam(teamId, request, userId, roles), "Team updated successfully"));
    }

    @DeleteMapping("/{teamId}")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(@PathVariable String teamId) {
        teamService.deleteTeam(teamId);
        return ResponseEntity.ok(ApiResponse.success(null, "Team deleted successfully"));
    }

    @PatchMapping("/{teamId}/lead")
    public ResponseEntity<ApiResponse<TeamResponse>> assignLead(
            @PathVariable String teamId,
            @Valid @RequestBody AssignLeadRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                teamService.assignLead(teamId, request), "Team lead assigned successfully"));
    }

    @DeleteMapping("/{teamId}/lead")
    public ResponseEntity<ApiResponse<TeamResponse>> removeLead(@PathVariable String teamId) {
        return ResponseEntity.ok(ApiResponse.success(
                teamService.removeLead(teamId), "Team lead removed"));
    }

    @PostMapping("/{teamId}/members/{userId}")
    public ResponseEntity<ApiResponse<TeamResponse>> addMember(
            @PathVariable String teamId,
            @PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success(
                teamService.addMember(teamId, userId), "Member added successfully"));
    }

    /**
     * POST /organizations/teams/{teamId}/assign/{userId}
     * Assign a user as a team member — only Team Leader of this team,
     * Department Leader of its department, HR, or CEO may call this.
     * Automatically grants the TEAM_MEMBER role to the assigned user.
     */
    @PostMapping("/{teamId}/assign/{userId}")
    public ResponseEntity<ApiResponse<TeamResponse>> assignMember(
            @PathVariable String teamId,
            @PathVariable String userId,
            @AuthenticationPrincipal String requestingUserId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<String> roles = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(
                teamService.assignMemberToTeam(teamId, userId, requestingUserId, roles),
                "User assigned to team successfully"));
    }

    // ── Follow / Unfollow ─────────────────────────────────────────────────────

    /**
     * POST /organizations/teams/{teamId}/follow
     * The authenticated user starts following this team.
     */
    @PostMapping("/{teamId}/follow")
    public ResponseEntity<ApiResponse<TeamResponse>> followTeam(
            @PathVariable String teamId,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(
                teamService.followTeam(teamId, userId), "Now following team"));
    }

    /**
     * DELETE /organizations/teams/{teamId}/follow
     * The authenticated user unfollows this team.
     */
    @DeleteMapping("/{teamId}/follow")
    public ResponseEntity<ApiResponse<TeamResponse>> unfollowTeam(
            @PathVariable String teamId,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(
                teamService.unfollowTeam(teamId, userId), "Unfollowed team"));
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable String teamId,
            @PathVariable String userId) {
        teamService.removeMember(teamId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully"));
    }

    // ── Image management ──────────────────────────────────────────────────────

    /**
     * PATCH /organizations/teams/{teamId}/avatar
     * Body: { "url": "https://..." }  — set to null or empty string to remove.
     */
    @PatchMapping("/{teamId}/avatar")
    public ResponseEntity<ApiResponse<TeamResponse>> updateAvatar(
            @PathVariable String teamId,
            @RequestBody UpdateImagesRequest request,
            @AuthenticationPrincipal String userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<String> roles = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(
                teamService.updateAvatar(teamId, request.getUrl(), userId, roles),
                "Team avatar updated"));
    }

    /**
     * PATCH /organizations/teams/{teamId}/banner
     * Body: { "url": "https://..." }  — set to null or empty string to remove.
     */
    @PatchMapping("/{teamId}/banner")
    public ResponseEntity<ApiResponse<TeamResponse>> updateBanner(
            @PathVariable String teamId,
            @RequestBody UpdateImagesRequest request,
            @AuthenticationPrincipal String userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<String> roles = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(
                teamService.updateBanner(teamId, request.getUrl(), userId, roles),
                "Team banner updated"));
    }
}
