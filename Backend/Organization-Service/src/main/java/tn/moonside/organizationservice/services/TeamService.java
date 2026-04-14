package tn.moonside.organizationservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.moonside.organizationservice.config.UserServiceClient;
import tn.moonside.organizationservice.dtos.requests.AssignLeadRequest;
import tn.moonside.organizationservice.dtos.requests.TeamRequest;
import tn.moonside.organizationservice.dtos.responses.TeamResponse;
import tn.moonside.organizationservice.dtos.responses.UserSummary;
import tn.moonside.organizationservice.dtos.responses.UserTeamResponse;
import tn.moonside.organizationservice.entities.Department;
import tn.moonside.organizationservice.entities.Team;
import tn.moonside.organizationservice.entities.UserTeam;
import tn.moonside.organizationservice.enums.VisibilityType;
import tn.moonside.organizationservice.repositories.DepartmentRepository;
import tn.moonside.organizationservice.repositories.TeamRepository;
import tn.moonside.organizationservice.repositories.UserTeamRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamService {

    private final TeamRepository teamRepository;
    private final DepartmentRepository departmentRepository;
    private final UserTeamRepository userTeamRepository;
    private final UserServiceClient userServiceClient;

    // ── Admin CRUD ────────────────────────────────────────────────────────────

    public TeamResponse createTeam(TeamRequest request) {
        // Validate department exists
        departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Department not found: " + request.getDepartmentId()));

        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .departmentId(request.getDepartmentId())
                .leadId(request.getLeadId())
                .image(request.getImage())
                .teamVisibility(request.getTeamVisibility() != null
                        ? request.getTeamVisibility()
                        : VisibilityType.PUBLIC)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return toResponse(teamRepository.save(team), null);
    }

    public TeamResponse getTeamById(String teamId, String requestingUserId) {
        Team team = findById(teamId);
        return toResponse(team, requestingUserId);
    }

    public List<TeamResponse> getAllTeams(String requestingUserId) {
        return teamRepository.findAll()
                .stream()
                .map(t -> toResponse(t, requestingUserId))
                .collect(Collectors.toList());
    }

    public List<TeamResponse> getTeamsByDepartment(String departmentId, String requestingUserId) {
        return teamRepository.findByDepartmentId(departmentId)
                .stream()
                .map(t -> toResponse(t, requestingUserId))
                .collect(Collectors.toList());
    }

    public List<TeamResponse> getPublicTeams(String requestingUserId) {
        return teamRepository.findByTeamVisibility(VisibilityType.PUBLIC)
                .stream()
                .map(t -> toResponse(t, requestingUserId))
                .collect(Collectors.toList());
    }

    public List<TeamResponse> searchTeams(String query, String requestingUserId) {
        return teamRepository.findByNameContainingIgnoreCase(query)
                .stream()
                .filter(t -> t.getTeamVisibility() == VisibilityType.PUBLIC)
                .map(t -> toResponse(t, requestingUserId))
                .collect(Collectors.toList());
    }

    public TeamResponse updateTeam(String teamId, TeamRequest request) {
        Team team = findById(teamId);

        // Validate new department if changed
        if (!team.getDepartmentId().equals(request.getDepartmentId())) {
            departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Department not found: " + request.getDepartmentId()));
        }

        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team.setDepartmentId(request.getDepartmentId());
        if (request.getLeadId() != null) team.setLeadId(request.getLeadId());
        if (request.getImage() != null) team.setImage(request.getImage());
        if (request.getTeamVisibility() != null) team.setTeamVisibility(request.getTeamVisibility());
        team.setUpdatedAt(LocalDateTime.now());

        return toResponse(teamRepository.save(team), null);
    }

    public void deleteTeam(String teamId) {
        Team team = findById(teamId);
        // Remove all memberships first
        userTeamRepository.findByTeamId(teamId)
                .forEach(ut -> userTeamRepository.deleteByUserIdAndTeamId(ut.getUserId(), teamId));
        teamRepository.delete(team);
    }

    // ── Lead assignment ───────────────────────────────────────────────────────

    public TeamResponse assignLead(String teamId, AssignLeadRequest request) {
        Team team = findById(teamId);
        team.setLeadId(request.getLeadId());
        team.setUpdatedAt(LocalDateTime.now());
        return toResponse(teamRepository.save(team), null);
    }

    public TeamResponse removeLead(String teamId) {
        Team team = findById(teamId);
        team.setLeadId(null);
        team.setUpdatedAt(LocalDateTime.now());
        return toResponse(teamRepository.save(team), null);
    }

    // ── Membership (self-service) ─────────────────────────────────────────────

    public TeamResponse joinTeam(String teamId, String userId) {
        Team team = findById(teamId);

        if (team.getTeamVisibility() == VisibilityType.PRIVATE) {
            throw new IllegalStateException("This team is private. Contact an admin to join.");
        }

        if (userTeamRepository.existsByUserIdAndTeamId(userId, teamId)) {
            throw new IllegalStateException("You are already a member of this team.");
        }

        UserTeam membership = UserTeam.builder()
                .userId(userId)
                .teamId(teamId)
                .joinedAt(LocalDateTime.now())
                .build();
        userTeamRepository.save(membership);

        return toResponse(team, userId);
    }

    public void leaveTeam(String teamId, String userId) {
        findById(teamId); // existence check
        if (!userTeamRepository.existsByUserIdAndTeamId(userId, teamId)) {
            throw new IllegalStateException("You are not a member of this team.");
        }
        userTeamRepository.deleteByUserIdAndTeamId(userId, teamId);
    }

    public List<TeamResponse> getMyTeams(String userId) {
        return userTeamRepository.findByUserId(userId)
                .stream()
                .map(ut -> teamRepository.findById(ut.getTeamId()).orElse(null))
                .filter(t -> t != null)
                .map(t -> toResponse(t, userId))
                .collect(Collectors.toList());
    }

    // ── Members ───────────────────────────────────────────────────────────────

    public List<UserTeamResponse> getTeamMembers(String teamId) {
        findById(teamId); // existence check
        return userTeamRepository.findByTeamId(teamId)
                .stream()
                .map(ut -> {
                    UserSummary user = userServiceClient.findById(ut.getUserId()).orElse(null);
                    return UserTeamResponse.builder()
                            .id(ut.getId())
                            .userId(ut.getUserId())
                            .teamId(ut.getTeamId())
                            .user(user)
                            .joinedAt(ut.getJoinedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /** Admin: remove any member from a team. */
    public void removeMember(String teamId, String userId) {
        findById(teamId);
        if (!userTeamRepository.existsByUserIdAndTeamId(userId, teamId)) {
            throw new IllegalStateException("User is not a member of this team.");
        }
        userTeamRepository.deleteByUserIdAndTeamId(userId, teamId);
    }

    /** Admin: add any user to a team (even PRIVATE teams). */
    public TeamResponse addMember(String teamId, String userId) {
        Team team = findById(teamId);
        if (userTeamRepository.existsByUserIdAndTeamId(userId, teamId)) {
            throw new IllegalStateException("User is already a member of this team.");
        }
        UserTeam membership = UserTeam.builder()
                .userId(userId)
                .teamId(teamId)
                .joinedAt(LocalDateTime.now())
                .build();
        userTeamRepository.save(membership);
        return toResponse(team, userId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Team findById(String id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + id));
    }

    public TeamResponse toResponse(Team team, String requestingUserId) {
        UserSummary lead = team.getLeadId() != null
                ? userServiceClient.findById(team.getLeadId()).orElse(null)
                : null;

        long memberCount = userTeamRepository.countByTeamId(team.getId());

        boolean isMember = requestingUserId != null &&
                userTeamRepository.existsByUserIdAndTeamId(requestingUserId, team.getId());

        String departmentName = departmentRepository.findById(team.getDepartmentId())
                .map(Department::getName)
                .orElse(null);

        return TeamResponse.builder()
                .id(team.getId())
                .departmentId(team.getDepartmentId())
                .departmentName(departmentName)
                .leadId(team.getLeadId())
                .lead(lead)
                .name(team.getName())
                .description(team.getDescription())
                .image(team.getImage())
                .teamVisibility(team.getTeamVisibility())
                .memberCount(memberCount)
                .isMember(isMember)
                .createdAt(team.getCreatedAt())
                .updatedAt(team.getUpdatedAt())
                .build();
    }
}
