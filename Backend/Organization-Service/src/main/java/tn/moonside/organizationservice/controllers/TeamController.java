package tn.moonside.organizationservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.moonside.organizationservice.dtos.requests.AssignLeadRequest;
import tn.moonside.organizationservice.dtos.requests.TeamRequest;
import tn.moonside.organizationservice.dtos.responses.ApiResponse;
import tn.moonside.organizationservice.dtos.responses.TeamResponse;
import tn.moonside.organizationservice.dtos.responses.UserTeamResponse;
import tn.moonside.organizationservice.services.TeamService;

import java.util.List;

@RestController
@RequestMapping("/organizations/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    // ── Public / authenticated reads ─────────────────────────────────────────

    /** All teams (admin view — includes PRIVATE). */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getAllTeams(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getAllTeams(userId)));
    }

    /** Only PUBLIC teams — for the discover feed. */
    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getPublicTeams(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getPublicTeams(userId)));
    }

    /** Search teams by name (PUBLIC only). */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> searchTeams(
            @RequestParam String q,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.searchTeams(q, userId)));
    }

    /** Teams the current user has joined. */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getMyTeams(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getMyTeams(userId)));
    }

    /** Teams belonging to a department. */
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getByDepartment(
            @PathVariable String departmentId,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(
                teamService.getTeamsByDepartment(departmentId, userId)));
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
            @Valid @RequestBody TeamRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                teamService.updateTeam(teamId, request), "Team updated successfully"));
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

    /** Admin: add any user to any team (bypasses PRIVATE restriction). */
    @PostMapping("/{teamId}/members/{userId}")
    public ResponseEntity<ApiResponse<TeamResponse>> addMember(
            @PathVariable String teamId,
            @PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success(
                teamService.addMember(teamId, userId), "Member added successfully"));
    }

    /** Admin: remove any member from a team. */
    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable String teamId,
            @PathVariable String userId) {
        teamService.removeMember(teamId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully"));
    }
}
