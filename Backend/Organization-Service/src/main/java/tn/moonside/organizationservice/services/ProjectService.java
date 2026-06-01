package tn.moonside.organizationservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import tn.moonside.organizationservice.audit.AuditClient;
import tn.moonside.organizationservice.audit.OrgAuditAction;
import tn.moonside.organizationservice.dtos.requests.ProjectRequest;
import tn.moonside.organizationservice.dtos.responses.ProjectResponse;
import tn.moonside.organizationservice.entities.Department;
import tn.moonside.organizationservice.entities.Project;
import tn.moonside.organizationservice.entities.Team;
import tn.moonside.organizationservice.enums.VisibilityType;
import tn.moonside.organizationservice.repositories.DepartmentRepository;
import tn.moonside.organizationservice.repositories.ProjectRepository;
import tn.moonside.organizationservice.repositories.TeamRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository    projectRepository;
    private final TeamRepository       teamRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditClient          auditClient;

    // ── Admin CRUD (CEO only, existing behaviour) ─────────────────────────────

    public ProjectResponse createProject(ProjectRequest request) {
        validateTeams(request.getTeamIds());
        Project saved = projectRepository.save(buildProject(request));
        auditClient.log(null, saved.getId(), "PROJECT", OrgAuditAction.PROJECT_CREATED,
                "Project '" + saved.getName() + "' created", true, null, null);
        return toResponse(saved);
    }

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> getPublicProjects() {
        return projectRepository.findAll().stream()
                .filter(p -> p.getVisibility() == VisibilityType.PUBLIC)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> getByTeam(String teamId) {
        return projectRepository.findByTeamIdsContaining(teamId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> search(String query) {
        return projectRepository.findByNameContainingIgnoreCase(query).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getById(String id) {
        return toResponse(findById(id));
    }

    public ProjectResponse updateProject(String id, ProjectRequest request) {
        Project project = findById(id);
        validateTeams(request.getTeamIds());
        String oldJson = toJson(project);

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setTeamIds(request.getTeamIds());
        project.setTechnologies(request.getTechnologies() != null ? request.getTechnologies() : List.of());
        project.setRepositoryUrl(request.getRepositoryUrl());
        project.setProjectUrl(request.getProjectUrl());
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setAvatarUrl(request.getAvatarUrl());
        project.setBannerUrl(request.getBannerUrl());
        if (request.getVisibility() != null) project.setVisibility(request.getVisibility());
        project.setUpdatedAt(LocalDateTime.now());

        Project saved = projectRepository.save(project);
        auditClient.log(null, saved.getId(), "PROJECT", OrgAuditAction.PROJECT_UPDATED,
                "Project '" + saved.getName() + "' updated", true, oldJson, toJson(saved));
        return toResponse(saved);
    }

    public void deleteProject(String id) {
        Project project = findById(id);
        projectRepository.deleteById(id);
        auditClient.log(null, id, "PROJECT", OrgAuditAction.PROJECT_DELETED,
                "Project '" + project.getName() + "' deleted", true, null, null);
    }

    // ── Team self-service ─────────────────────────────────────────────────────

    /**
     * A TEAM_LEADER (or CEO / DEPARTMENT_LEADER of that team's dept) can create
     * a project directly for their own team.  The teamId in the path is
     * automatically injected as the sole responsible team.
     *
     * @param teamId       the team the project will belong to
     * @param request      project details (teamIds in body is ignored / overridden)
     * @param requesterId  user ID extracted from JWT
     * @param roles        roles extracted from JWT
     */
    public ProjectResponse createProjectForTeam(String teamId,
                                                ProjectRequest request,
                                                String requesterId,
                                                List<String> roles) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        // authorisation: CEO, or TEAM_LEADER of this exact team,
        // or DEPARTMENT_LEADER whose department contains this team
        boolean isCeo           = roles.contains("CEO");
        boolean isTeamLeader    = roles.contains("TEAM_LEADER")
                && requesterId.equals(team.getLeadId());
        boolean isDeptLeader    = roles.contains("DEPARTMENT_LEADER")
                && team.getDepartmentId() != null
                && departmentRepository.findById(team.getDepartmentId())
                        .map(d -> requesterId.equals(d.getManagerId()))
                        .orElse(false);

        if (!isCeo && !isTeamLeader && !isDeptLeader) {
            throw new AccessDeniedException("Not authorised to create projects for this team");
        }

        // force the project to be assigned to this team regardless of body
        request.setTeamIds(List.of(teamId));

        Project saved = projectRepository.save(buildProject(request));
        auditClient.log(requesterId, saved.getId(), "PROJECT", OrgAuditAction.PROJECT_CREATED,
                "Project '" + saved.getName() + "' created by team '" + team.getName() + "'",
                true, null, null);
        return toResponse(saved);
    }

    // ── Department project creation ───────────────────────────────────────────

    /**
     * A DEPARTMENT_LEADER (or CEO) can create a project and assign it to any
     * team that belongs to their department.  The selected teamId must be a
     * team of the given department.
     *
     * @param deptId       the department context
     * @param request      project details; request.teamIds must contain exactly
     *                     one team ID that belongs to this department
     * @param requesterId  user ID extracted from JWT
     * @param roles        roles extracted from JWT
     */
    public ProjectResponse createProjectForDepartment(String deptId,
                                                      ProjectRequest request,
                                                      String requesterId,
                                                      List<String> roles) {
        Department dept = departmentRepository.findById(deptId)
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + deptId));

        boolean isCeo        = roles.contains("CEO");
        boolean isDeptLeader = roles.contains("DEPARTMENT_LEADER")
                && requesterId.equals(dept.getManagerId());

        if (!isCeo && !isDeptLeader) {
            throw new AccessDeniedException("Not authorised to create projects for this department");
        }

        // Validate that every selected team belongs to this department
        List<String> teamIds = request.getTeamIds();
        if (teamIds == null || teamIds.isEmpty()) {
            throw new IllegalArgumentException("At least one team ID is required");
        }
        for (String tid : teamIds) {
            Team t = teamRepository.findById(tid)
                    .orElseThrow(() -> new IllegalArgumentException("Team not found: " + tid));
            if (!deptId.equals(t.getDepartmentId())) {
                throw new IllegalArgumentException(
                        "Team '" + t.getName() + "' does not belong to this department");
            }
        }

        Project saved = projectRepository.save(buildProject(request));
        auditClient.log(requesterId, saved.getId(), "PROJECT", OrgAuditAction.PROJECT_CREATED,
                "Project '" + saved.getName() + "' created by department '" + dept.getName() + "'",
                true, null, null);
        return toResponse(saved);
    }

    /**
     * Returns all projects whose teamIds intersect with the teams of a given department.
     */
    public List<ProjectResponse> getByDepartment(String deptId) {
        List<String> teamIds = teamRepository.findByDepartmentId(deptId)
                .stream().map(Team::getId).collect(Collectors.toList());
        if (teamIds.isEmpty()) return List.of();
        return teamIds.stream()
                .flatMap(tid -> projectRepository.findByTeamIdsContaining(tid).stream())
                .distinct()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Project buildProject(ProjectRequest request) {
        return Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .teamIds(request.getTeamIds() != null ? request.getTeamIds() : List.of())
                .technologies(request.getTechnologies() != null ? request.getTechnologies() : List.of())
                .repositoryUrl(request.getRepositoryUrl())
                .projectUrl(request.getProjectUrl())
                .status(request.getStatus() != null
                        ? request.getStatus()
                        : tn.moonside.organizationservice.enums.ProjectStatus.PLANNING)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .avatarUrl(request.getAvatarUrl())
                .bannerUrl(request.getBannerUrl())
                .visibility(request.getVisibility() != null
                        ? request.getVisibility()
                        : VisibilityType.PUBLIC)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private void validateTeams(List<String> teamIds) {
        if (teamIds == null || teamIds.isEmpty()) {
            throw new IllegalArgumentException("At least one team ID is required");
        }
        for (String tid : teamIds) {
            if (!teamRepository.existsById(tid)) {
                throw new IllegalArgumentException("Team not found: " + tid);
            }
        }
    }

    private Project findById(String id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));
    }

    public ProjectResponse toResponse(Project project) {
        List<ProjectResponse.TeamSummary> teams = project.getTeamIds().stream()
                .map(tid -> teamRepository.findById(tid).orElse(null))
                .filter(t -> t != null)
                .map(t -> ProjectResponse.TeamSummary.builder()
                        .id(t.getId())
                        .name(t.getName())
                        .avatarUrl(t.getAvatarUrl())
                        .build())
                .collect(Collectors.toList());

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .teams(teams)
                .technologies(project.getTechnologies())
                .repositoryUrl(project.getRepositoryUrl())
                .projectUrl(project.getProjectUrl())
                .status(project.getStatus())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .avatarUrl(project.getAvatarUrl())
                .bannerUrl(project.getBannerUrl())
                .visibility(project.getVisibility())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private String toJson(Project p) {
        return "{\"id\":\"" + p.getId() + "\""
                + ",\"name\":\"" + esc(p.getName()) + "\""
                + ",\"status\":\"" + p.getStatus() + "\""
                + ",\"visibility\":\"" + p.getVisibility() + "\""
                + "}";
    }

    private String esc(String s) { return s == null ? "" : s.replace("\"", "\\\""); }
}
