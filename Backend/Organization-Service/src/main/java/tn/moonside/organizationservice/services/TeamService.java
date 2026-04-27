package tn.moonside.organizationservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.moonside.organizationservice.audit.AuditClient;
import tn.moonside.organizationservice.audit.OrgAuditAction;
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

    private final TeamRepository      teamRepository;
    private final DepartmentRepository departmentRepository;
    private final UserTeamRepository  userTeamRepository;
    private final UserServiceClient   userServiceClient;
    private final FollowRepository    followRepository;
    private final AuditClient         auditClient;          // ← NEW

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

        Team saved = teamRepository.save(team);
        TeamResponse response = toResponse(saved, null);

        // Assign TEAM_LEADER role to the designated lead and add them as a team member
        if (request.getLeadId() != null && !request.getLeadId().isBlank()) {
            userServiceClient.assignLeaderRole(request.getLeadId(), "TEAM_LEADER");
            if (!userTeamRepository.existsByUserIdAndTeamId(request.getLeadId(), saved.getId())) {
                userTeamRepository.save(UserTeam.builder()
                        .userId(request.getLeadId())
                        .teamId(saved.getId())
                        .joinedAt(LocalDateTime.now())
                        .build());
            }
        }

        auditClient.log(
                null,                            // actor resolved by controller layer; null = system/admin
                saved.getId(),
                "TEAM",
                OrgAuditAction.TEAM_CREATED,
                "Team '" + saved.getName() + "' created in department " + saved.getDepartmentId(),
                true,
                null,
                toJson(saved));

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

        String oldSnapshot = toJson(team);

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
                // Ensure new lead is a member of the team
                if (!userTeamRepository.existsByUserIdAndTeamId(newLeadId, team.getId())) {
                    userTeamRepository.save(UserTeam.builder()
                            .userId(newLeadId)
                            .teamId(team.getId())
                            .joinedAt(LocalDateTime.now())
                            .build());
                }
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

        Team saved = teamRepository.save(team);

        auditClient.log(
                requestingUserId,
                saved.getId(),
                "TEAM",
                OrgAuditAction.TEAM_UPDATED,
                "Team '" + saved.getName() + "' updated by user " + requestingUserId,
                true,
                oldSnapshot,
                toJson(saved));

        return toResponse(saved, requestingUserId);
    }

    public void deleteTeam(String teamId) {
        Team team = findById(teamId);
        String snapshot = toJson(team);

        userTeamRepository.findByTeamId(teamId)
                .forEach(ut -> userTeamRepository.deleteByUserIdAndTeamId(ut.getUserId(), teamId));
        teamRepository.delete(team);

        auditClient.log(
                null,
                teamId,
                "TEAM",
                OrgAuditAction.TEAM_DELETED,
                "Team '" + team.getName() + "' deleted",
                true,
                snapshot,
                null);
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
            // Ensure the new lead is a member of the team
            if (!userTeamRepository.existsByUserIdAndTeamId(request.getLeadId(), teamId)) {
                userTeamRepository.save(UserTeam.builder()
                        .userId(request.getLeadId())
                        .teamId(teamId)
                        .joinedAt(LocalDateTime.now())
                        .build());
            }
        }

        auditClient.log(
                null,
                teamId,
                "TEAM",
                OrgAuditAction.TEAM_LEAD_ASSIGNED,
                "Lead of team '" + team.getName() + "' assigned to user " + request.getLeadId()
                        + " (was: " + previousLeadId + ")",
                true,
                previousLeadId,
                request.getLeadId());

        return response;
    }

    public TeamResponse removeLead(String teamId) {
        Team team = findById(teamId);
        String previousLeadId = team.getLeadId();
        team.setLeadId(null);
        team.setUpdatedAt(LocalDateTime.now());
        TeamResponse response = toResponse(teamRepository.save(team), null);

        if (previousLeadId != null && !previousLeadId.isBlank()) {
            userServiceClient.revokeLeaderRole(previousLeadId, "TEAM_LEADER");
        }

        auditClient.log(
                null,
                teamId,
                "TEAM",
                OrgAuditAction.TEAM_LEAD_REMOVED,
                "Lead removed from team '" + team.getName() + "' (was: " + previousLeadId + ")",
                true,
                previousLeadId,
                null);

        return response;
    }

    // ── Image management ──────────────────────────────────────────────────────

    public TeamResponse updateAvatar(String teamId, String avatarUrl,
                                     String requestingUserId, List<String> roles) {
        Team team = findById(teamId);
        assertCanEdit(team, requestingUserId, roles);
        String old = team.getAvatarUrl();
        team.setAvatarUrl(avatarUrl);
        team.setUpdatedAt(LocalDateTime.now());
        Team saved = teamRepository.save(team);

        auditClient.log(
                requestingUserId,
                teamId,
                "TEAM",
                OrgAuditAction.TEAM_AVATAR_UPDATED,
                "Avatar updated for team '" + team.getName() + "'",
                true,
                old,
                avatarUrl);

        return toResponse(saved, requestingUserId);
    }

    public TeamResponse updateBanner(String teamId, String bannerUrl,
                                     String requestingUserId, List<String> roles) {
        Team team = findById(teamId);
        assertCanEdit(team, requestingUserId, roles);
        String old = team.getBannerUrl();
        team.setBannerUrl(bannerUrl);
        team.setUpdatedAt(LocalDateTime.now());
        Team saved = teamRepository.save(team);

        auditClient.log(
                requestingUserId,
                teamId,
                "TEAM",
                OrgAuditAction.TEAM_BANNER_UPDATED,
                "Banner updated for team '" + team.getName() + "'",
                true,
                old,
                bannerUrl);

        return toResponse(saved, requestingUserId);
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

        auditClient.log(
                userId,
                teamId,
                "TEAM",
                OrgAuditAction.TEAM_JOINED,
                "User " + userId + " joined team '" + team.getName() + "'",
                true,
                null,
                null);

        return toResponse(team, userId);
    }

    public void leaveTeam(String teamId, String userId) {
        Team team = findById(teamId);
        if (!userTeamRepository.existsByUserIdAndTeamId(userId, teamId)) {
            throw new IllegalStateException("You are not a member of this team.");
        }
        userTeamRepository.deleteByUserIdAndTeamId(userId, teamId);

        auditClient.log(
                userId,
                teamId,
                "TEAM",
                OrgAuditAction.TEAM_LEFT,
                "User " + userId + " left team '" + team.getName() + "'",
                true,
                null,
                null);
    }

    public List<TeamResponse> getMyTeams(String userId) {
        return userTeamRepository.findByUserId(userId)
                .stream()
                .map(ut -> teamRepository.findById(ut.getTeamId()).orElse(null))
                .filter(t -> t != null)
                .map(t -> toResponse(t, userId))
                .collect(Collectors.toList());
    }

    // ── Members (admin) ───────────────────────────────────────────────────────

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
        Team team = findById(teamId);
        if (!userTeamRepository.existsByUserIdAndTeamId(userId, teamId)) {
            throw new IllegalStateException("User is not a member of this team.");
        }
        userTeamRepository.deleteByUserIdAndTeamId(userId, teamId);

        auditClient.log(
                null,
                teamId,
                "TEAM",
                OrgAuditAction.TEAM_MEMBER_REMOVED,
                "User " + userId + " removed from team '" + team.getName() + "'",
                true,
                userId,
                null);
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

        auditClient.log(
                null,
                teamId,
                "TEAM",
                OrgAuditAction.TEAM_MEMBER_ADDED,
                "User " + userId + " added to team '" + team.getName() + "'",
                true,
                null,
                userId);

        return toResponse(team, userId);
    }

    // ── Assign member (by leader / HR) ────────────────────────────────────────

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

        auditClient.log(
                requestingUserId,
                teamId,
                "TEAM",
                OrgAuditAction.TEAM_MEMBER_ASSIGNED,
                "User " + userId + " assigned to team '" + team.getName()
                        + "' by " + requestingUserId,
                true,
                null,
                userId);

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

            auditClient.log(
                    userId,
                    teamId,
                    "TEAM",
                    OrgAuditAction.TEAM_FOLLOWED,
                    "User " + userId + " followed team '" + team.getName() + "'",
                    true,
                    null,
                    null);
        }
        return toResponse(team, userId);
    }

    public TeamResponse unfollowTeam(String teamId, String userId) {
        Team team = findById(teamId);
        followRepository.deleteByUserIdAndTargetIdAndTargetType(userId, teamId, FollowTargetType.TEAM);

        auditClient.log(
                userId,
                teamId,
                "TEAM",
                OrgAuditAction.TEAM_UNFOLLOWED,
                "User " + userId + " unfollowed team '" + team.getName() + "'",
                true,
                null,
                null);

        return toResponse(team, userId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void assertCanAssignMember(Team team, String requestingUserId, List<String> roles) {
        boolean isAdmin       = roles.contains("CEO");
        boolean isHr          = roles.contains("HUMAN_RESOURCES");
        boolean isTeamLeader  = roles.contains("TEAM_LEADER")
                && requestingUserId.equals(team.getLeadId());
        boolean isDeptManager = roles.contains("DEPARTMENT_LEADER")
                && departmentRepository.findById(team.getDepartmentId())
                        .map(d -> requestingUserId.equals(d.getManagerId()))
                        .orElse(false);
        if (!isAdmin && !isHr && !isTeamLeader && !isDeptManager) {
            throw new AccessDeniedException(
                    "Only a Team Leader of this team, its Department Leader, HR, or CEO may assign members.");
        }
    }

    private void assertCanEdit(Team team, String requestingUserId, List<String> roles) {
        boolean isAdmin      = roles.contains("CEO");
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

    /** Minimal JSON snapshot for audit old/newValue fields. */
    private String toJson(Team t) {
        return "{\"id\":\"" + t.getId() + "\""
                + ",\"name\":\"" + esc(t.getName()) + "\""
                + ",\"departmentId\":\"" + esc(t.getDepartmentId()) + "\""
                + ",\"leadId\":" + (t.getLeadId() == null ? "null" : "\"" + t.getLeadId() + "\"")
                + ",\"visibility\":\"" + t.getTeamVisibility() + "\""
                + "}";
    }

    private String esc(String s) { return s == null ? "" : s.replace("\"", "\\\""); }

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
