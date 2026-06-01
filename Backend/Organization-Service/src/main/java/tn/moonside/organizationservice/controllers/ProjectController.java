package tn.moonside.organizationservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import tn.moonside.organizationservice.dtos.requests.ProjectRequest;
import tn.moonside.organizationservice.dtos.responses.ApiResponse;
import tn.moonside.organizationservice.dtos.responses.ProjectResponse;
import tn.moonside.organizationservice.services.ProjectService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // ── /organizations/projects — existing admin endpoints ────────────────────

    @GetMapping("/organizations/projects")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(projectService.getAllProjects()));
    }

    @GetMapping("/organizations/projects/public")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getPublic() {
        return ResponseEntity.ok(ApiResponse.success(projectService.getPublicProjects()));
    }

    @GetMapping("/organizations/projects/search")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> search(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.success(projectService.search(q)));
    }

    @GetMapping("/organizations/projects/team/{teamId}")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getByTeam(
            @PathVariable String teamId) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getByTeam(teamId)));
    }

    @GetMapping("/organizations/projects/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getById(id)));
    }

    /** CEO-only: create project from the back-office. */
    @PostMapping("/organizations/projects")
    public ResponseEntity<ApiResponse<ProjectResponse>> create(
            @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(projectService.createProject(request), "Project created successfully"));
    }

    @PutMapping("/organizations/projects/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.updateProject(id, request), "Project updated successfully"));
    }

    @DeleteMapping("/organizations/projects/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Project deleted successfully"));
    }

    // ── /organizations/teams/{teamId}/projects — team self-service ────────────

    /**
     * GET /organizations/teams/{teamId}/projects
     * Returns all projects assigned to a team. Accessible by any authenticated user.
     */
    @GetMapping("/organizations/teams/{teamId}/projects")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getProjectsByTeam(
            @PathVariable String teamId) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getByTeam(teamId)));
    }

    /**
     * POST /organizations/teams/{teamId}/projects
     * Team Leader (of this team), Department Leader (of this team's dept), or CEO
     * can create a project that is automatically assigned to this team.
     */
    @PostMapping("/organizations/teams/{teamId}/projects")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProjectForTeam(
            @PathVariable String teamId,
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal String userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<String> roles = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        projectService.createProjectForTeam(teamId, request, userId, roles),
                        "Project created successfully"));
    }

    // ── /organizations/departments/{deptId}/projects — department projects ─────

    /**
     * GET /organizations/departments/{deptId}/projects
     * Returns all projects belonging to any team in this department.
     */
    @GetMapping("/organizations/departments/{deptId}/projects")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getProjectsByDepartment(
            @PathVariable String deptId) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getByDepartment(deptId)));
    }

    /**
     * POST /organizations/departments/{deptId}/projects
     * Department Leader (of this dept) or CEO can create a project and assign it
     * to a team that belongs to this department (teamIds in request body).
     */
    @PostMapping("/organizations/departments/{deptId}/projects")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProjectForDepartment(
            @PathVariable String deptId,
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal String userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<String> roles = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        projectService.createProjectForDepartment(deptId, request, userId, roles),
                        "Project created successfully"));
    }
}
