package tn.moonside.organizationservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.moonside.organizationservice.dtos.requests.ProjectRequest;
import tn.moonside.organizationservice.dtos.responses.ApiResponse;
import tn.moonside.organizationservice.dtos.responses.ProjectResponse;
import tn.moonside.organizationservice.services.ProjectService;

import java.util.List;

@RestController
@RequestMapping("/organizations/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // ── Public / authenticated reads ─────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(projectService.getAllProjects()));
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getPublic() {
        return ResponseEntity.ok(ApiResponse.success(projectService.getPublicProjects()));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> search(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.success(projectService.search(q)));
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getByTeam(
            @PathVariable String teamId) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getByTeam(teamId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getById(id)));
    }

    // ── Admin mutations ───────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> create(
            @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(projectService.createProject(request), "Project created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.updateProject(id, request), "Project updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Project deleted successfully"));
    }
}
