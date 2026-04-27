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
import tn.moonside.organizationservice.entities.Follow;
import tn.moonside.organizationservice.entities.Team;
import tn.moonside.organizationservice.entities.UserTeam;
import tn.moonside.organizationservice.enums.FollowTargetType;
import tn.moonside.organizationservice.enums.VisibilityType;
import tn.moonside.organizationservice.repositories.DepartmentRepository;
import tn.moonside.organizationservice.repositories.FollowRepository;
import tn.moonside.organizationservice.repositories.TeamRepository;
import tn.moonside.organizationservice.repositories.UserTeamRepository;

import org.springframework.security.access.AccessDeniedException;

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
    private final FollowRepository followRepository;

    // ── Admin CRUD ────────────────────────────────────────────────────────────

    public TeamResponse createTeam(TeamRequest request) {
        departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Department not found: " + request.getDepartmentId()));

        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .departmentId(request.getDepartmentId())
                .leadId(request.getLeadId())
                .avatarUrl(request.getAvatarUrl())
                .bannerUrl(request.getBannerUrl())
                .teamVisibility(request.getTeamVisibility() != null
                        ? request.getTeamVisibility()
                        : VisibilityType.PUBLIC)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        TeamResponse response = toResponse(teamRepository.save(team), null);

        // Assign TEAM_LEADER role to the designated lead
        if (request.getLeadId() != null && !request.getLeadId().isBlank()) {
            userServiceClient.assignLeaderRole(request.getLeadId(), "TEAM_LEADER");
        }

        return response;
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

    /**
     * Update a team.
     * Access rules:
     *  - ADMIN              → always allowed
     *  - TEAM_LEADER        → only if they are the lead of this specific team
     *  - DEPARTMENT_MANAGER → only if they manage the department this team belongs to
     */
    public TeamResponse updateTeam(String teamId, TeamRequest request,
                                   String requestingUserId, List<String> roles) {
        Team team = findById(teamId);
        assertCanEdit(team, requestingUserId, roles);

        // Validate new department if changed — only admins and dept managers may move a team
        if (!team.getDepartmentId().equals(request.getDepartmentId())) {
            boolean isAdmin = roles.contains("CEO");
            boolean isDeptManager = roles.contains("DEPARTMENT_LEADER")
                    && departmentRepository.findById(team.getDepartmentId())
                            .map(d -> requestingUserId.equals(d.getManagerId()))
                            .orElse(false);
            if (!isAdmin && !isDeptManager) {
                throw new AccessDeniedException(
                        "Only admins or department managers can move a team to a different department.");
            }
            departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Department not found: " + request.getDepartmentId()));
        }

        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team.setDepartmentId(request.getDepartmentId());
        if (request.getLeadId() != null) {
            String previousLeadId = team.getLeadId();
            String newLeadId = request.getLeadId();
            if (!newLeadId.isBlank() && !newLeadId.equals(previousLeadId)) {
                if (previousLeadId != null && !previousLeadId.isBlank()) {
                    userServiceClient.revokeLeaderRole(previousLeadId, "TEAM_LEADER");
                }
                userServiceClient.assignLeaderRole(newLeadId, "TEAM_LEADER");
            }
            team.setLeadId(newLeadId);
        }
        if (request.getAvatarUrl() != null) {
            team.setAvatarUrl(request.getAvatarUrl().isBlank() ? null : request.getAvatarUrl());
        }
        if (request.getBannerUrl() != null) {
            team.setBannerUrl(request.getBannerUrl().isBlank() ? null : request.getBannerUrl());
        }
        if (request.getTeamVisibility() != null) team.setTeamVisibility(request.getTeamVisibility());
        team.setUpdatedAt(LocalDateTime.now());

        return toResponse(teamRepository.save(team), requestingUserId);
    }

    public void deleteTeam(String teamId) {
        Team team = findById(teamId);
        userTeamRepository.findByTeamId(teamId)
                .forEach(ut -> userTeamRepository.deleteByUserIdAndTeamId(ut.getUserId(), teamId));
        teamRepository.delete(team);
    }

    // ── Lead assignment ───────────────────────────────────────────────────────

    public TeamResponse assignLead(String teamId, AssignLeadRequest request) {
        Team team = findById(teamId);
        String previousLeadId = team.getLeadId();
        team.setLeadId(request.getLeadId());
        team.setUpdatedAt(LocalDateTime.now());
        TeamResponse response = toResponse(teamRepository.save(team), null);

        // Revoke role from old lead (if changed) and assign to new one
        if (request.getLeadId() != null && !request.getLeadId().isBlank()) {
            if (previousLeadId != null && !previousLeadId.equals(request.getLeadId())) {
                userServiceClient.revokeLeaderRole(previousLeadId, "TEAM_LEADER");
            }
            userServiceClient.assignLeaderRole(request.getLeadId(), "TEAM_LEADER");
        }

        return response;
    }

    public TeamResponse removeLead(String teamId) {
        Team team = findById(teamId);
        String previousLeadId = team.getLeadId();
        team.setLeadId(null);
        team.setUpdatedAt(LocalDateTime.now());
        TeamResponse response = toResponse(teamRepository.save(team), null);

        // Revoke TEAM_LEADER role from former lead
        if (previousLeadId != null && !previousLeadId.isBlank()) {
            userServiceClient.revokeLeaderRole(previousLeadId, "TEAM_LEADER");
        }

        return response;
    }

    // ── Image management ──────────────────────────────────────────────────────

    /**
     * Update or remove the team avatar.
     * Access: ADMIN, TEAM_LEADER of this team, or DEPARTMENT_MANAGER of its department.
     */
    public TeamResponse updateAvatar(String teamId, String avatarUrl,
                                     String requestingUserId, List<String> roles) {
        Team team = findById(teamId);
        assertCanEdit(team, requestingUserId, roles);
        team.setAvatarUrl(avatarUrl);
        team.setUpdatedAt(LocalDateTime.now());
        return toResponse(teamRepository.save(team), requestingUserId);
    }

    /**
     * Update or remove the team banner.
     * Access: ADMIN, TEAM_LEADER of this team, or DEPARTMENT_MANAGER of its department.
     */
    public TeamResponse updateBanner(String teamId, String bannerUrl,
                                     String requestingUserId, List<String> roles) {
        Team team = findById(teamId);
        assertCanEdit(team, requestingUserId, roles);
        team.setBannerUrl(bannerUrl);
        team.setUpdatedAt(LocalDateTime.now());
        return toResponse(teamRepository.save(team), requestingUserId);
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
        findById(teamId);
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
        findById(teamId);
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

    public void removeMember(String teamId, String userId) {
        findById(teamId);
        if (!userTeamRepository.existsByUserIdAndTeamId(userId, teamId)) {
            throw new IllegalStateException("User is not a member of this team.");
        }
        userTeamRepository.deleteByUserIdAndTeamId(userId, teamId);
    }

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

    // ── Assign member (by leader / HR) ────────────────────────────────────────

    /**
     * Assign a user as a member of a team.
     * Authorised callers: CEO, the team's own TEAM_LEADER, a DEPARTMENT_LEADER
     * who manages the team's department, or HUMAN_RESOURCES (any team).
     * The assigned user automatically receives the TEAM_MEMBER role.
     */
    public TeamResponse assignMemberToTeam(String teamId, String userId,
                                           String requestingUserId, List<String> roles) {
        Team team = findById(teamId);
        assertCanAssignMember(team, requestingUserId, roles);

        if (!userTeamRepository.existsByUserIdAndTeamId(userId, teamId)) {
            UserTeam membership = UserTeam.builder()
                    .userId(userId)
                    .teamId(teamId)
                    .joinedAt(LocalDateTime.now())
                    .build();
            userTeamRepository.save(membership);
        }

        // Auto-grant TEAM_MEMBER role to the assigned user
        userServiceClient.assignLeaderRole(userId, "TEAM_MEMBER");

        return toResponse(team, requestingUserId);
    }

    // ── Follow / Unfollow ─────────────────────────────────────────────────────

    public TeamResponse followTeam(String teamId, String userId) {
        Team team = findById(teamId);
        if (!followRepository.existsByUserIdAndTargetIdAndTargetType(userId, teamId, FollowTargetType.TEAM)) {
            followRepository.save(Follow.builder()
                    .userId(userId)
                    .targetId(teamId)
                    .targetType(FollowTargetType.TEAM)
                    .build());
        }
        return toResponse(team, userId);
    }

    public TeamResponse unfollowTeam(String teamId, String userId) {
        Team team = findById(teamId);
        followRepository.deleteByUserIdAndTargetIdAndTargetType(userId, teamId, FollowTargetType.TEAM);
        return toResponse(team, userId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void assertCanAssignMember(Team team, String requestingUserId, List<String> roles) {
        boolean isAdmin          = roles.contains("CEO");
        boolean isHr             = roles.contains("HUMAN_RESOURCES");
        boolean isTeamLeader     = roles.contains("TEAM_LEADER")
                && requestingUserId.equals(team.getLeadId());
        boolean isDeptManager    = roles.contains("DEPARTMENT_LEADER")
                && departmentRepository.findById(team.getDepartmentId())
                        .map(d -> requestingUserId.equals(d.getManagerId()))
                        .orElse(false);
        if (!isAdmin && !isHr && !isTeamLeader && !isDeptManager) {
            throw new AccessDeniedException(
                    "Only a Team Leader of this team, its Department Leader, HR, or CEO may assign members.");
        }
    }

    private void assertCanEdit(Team team, String requestingUserId, List<String> roles) {
        boolean isAdmin = roles.contains("CEO");
        boolean isTeamLeader = roles.contains("TEAM_LEADER")
                && requestingUserId.equals(team.getLeadId());
        boolean isDeptManager = roles.contains("DEPARTMENT_LEADER")
                && departmentRepository.findById(team.getDepartmentId())
                        .map(d -> requestingUserId.equals(d.getManagerId()))
                        .orElse(false);
        if (!isAdmin && !isTeamLeader && !isDeptManager) {
            throw new AccessDeniedException("You are not authorized to modify this team.");
        }
    }

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

        boolean isFollowing = requestingUserId != null &&
                followRepository.existsByUserIdAndTargetIdAndTargetType(
                        requestingUserId, team.getId(), FollowTargetType.TEAM);

        long followerCount = followRepository.countByTargetIdAndTargetType(
                team.getId(), FollowTargetType.TEAM);

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
                .avatarUrl(team.getAvatarUrl())
                .bannerUrl(team.getBannerUrl())
                .teamVisibility(team.getTeamVisibility())
                .memberCount(memberCount)
                .isMember(isMember)
                .isFollowing(isFollowing)
                .followerCount(followerCount)
                .createdAt(team.getCreatedAt())
                .updatedAt(team.getUpdatedAt())
                .build();
    }
}
