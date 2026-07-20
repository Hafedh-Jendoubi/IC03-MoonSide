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

    private final TeamRepository       teamRepository;
    private final DepartmentRepository departmentRepository;
    private final UserTeamRepository   userTeamRepository;
    private final UserServiceClient    userServiceClient;
    private final FollowRepository     followRepository;
    private final AuditClient          auditClient;

    // ── Admin CRUD ────────────────────────────────────────────────────────────

    public TeamResponse createTeam(TeamRequest request) {
        // departmentId is now optional — validate only if provided
        String rawDeptId = request.getDepartmentId();
        final String deptId; // effectively final — assigned once below
        if (rawDeptId != null && !rawDeptId.isBlank()) {
            departmentRepository.findById(rawDeptId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Department not found: " + rawDeptId));
            deptId = rawDeptId;
        } else {
            deptId = null; // normalise empty string → null
        }

        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .departmentId(deptId)
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

        String deptName = deptId != null
                ? departmentRepository.findById(deptId).map(Department::getName).orElse(deptId)
                : "independent";

        auditClient.log(null, saved.getId(), "TEAM", OrgAuditAction.TEAM_CREATED,
                "Team '" + saved.getName() + "' created in department '" + deptName + "'",
                true, null, toJson(saved));

        return toResponse(saved, null);
    }

    public TeamResponse getTeamById(String teamId, String requestingUserId) {
        return toResponse(findById(teamId), requestingUserId);
    }

    public List<TeamResponse> getAllTeams(String requestingUserId) {
        return teamRepository.findAll().stream()
                .map(t -> toResponse(t, requestingUserId))
                .collect(Collectors.toList());
    }

    /** Teams with no department (shown on the Discover page). */
    public List<TeamResponse> getIndependentTeams(String requestingUserId) {
        return teamRepository.findByDepartmentIdIsNull().stream()
                .filter(t -> t.getTeamVisibility() == VisibilityType.PUBLIC)
                .map(t -> toResponse(t, requestingUserId))
                .collect(Collectors.toList());
    }

    public List<TeamResponse> getTeamsByDepartment(String departmentId,
                                                    String requestingUserId,
                                                    List<String> roles) {
        boolean isCeo = roles != null && roles.contains("CEO");
        java.util.Set<String> accessiblePrivate = new java.util.HashSet<>();

        if (requestingUserId != null && !requestingUserId.isBlank()) {
            if (isCeo) {
                teamRepository.findByDepartmentId(departmentId)
                        .stream()
                        .filter(t -> t.getTeamVisibility() == VisibilityType.PRIVATE)
                        .forEach(t -> accessiblePrivate.add(t.getId()));
            } else {
                userTeamRepository.findByUserId(requestingUserId)
                        .forEach(ut -> accessiblePrivate.add(ut.getTeamId()));
                teamRepository.findByLeadId(requestingUserId)
                        .stream()
                        .filter(t -> t.getTeamVisibility() == VisibilityType.PRIVATE
                                && departmentId.equals(t.getDepartmentId()))
                        .forEach(t -> accessiblePrivate.add(t.getId()));
                if (roles != null && roles.contains("DEPARTMENT_LEADER")) {
                    departmentRepository.findByManagerId(requestingUserId)
                            .stream()
                            .filter(d -> d.getId().equals(departmentId))
                            .findFirst()
                            .ifPresent(d ->
                                teamRepository.findByDepartmentId(departmentId)
                                        .stream()
                                        .filter(t -> t.getTeamVisibility() == VisibilityType.PRIVATE)
                                        .forEach(t -> accessiblePrivate.add(t.getId()))
                            );
                }
            }
        }

        return teamRepository.findByDepartmentId(departmentId).stream()
                .filter(t -> t.getTeamVisibility() == VisibilityType.PUBLIC
                        || accessiblePrivate.contains(t.getId()))
                .map(t -> toResponse(t, requestingUserId))
                .collect(Collectors.toList());
    }

    @Deprecated
    public List<TeamResponse> getTeamsByDepartment(String departmentId, String requestingUserId) {
        return getTeamsByDepartment(departmentId, requestingUserId, null);
    }

    public List<TeamResponse> getPublicTeams(String requestingUserId) {
        return teamRepository.findByTeamVisibility(VisibilityType.PUBLIC).stream()
                .map(t -> toResponse(t, requestingUserId))
                .collect(Collectors.toList());
    }

    public List<TeamResponse> getVisibleTeams(String requestingUserId, List<String> roles) {
        boolean isCeo = roles != null && roles.contains("CEO");
        java.util.Set<String> accessiblePrivate = new java.util.HashSet<>();

        if (requestingUserId != null && !requestingUserId.isBlank()) {
            if (isCeo) {
                teamRepository.findByTeamVisibility(VisibilityType.PRIVATE)
                        .forEach(t -> accessiblePrivate.add(t.getId()));
            } else {
                userTeamRepository.findByUserId(requestingUserId)
                        .forEach(ut -> accessiblePrivate.add(ut.getTeamId()));
                teamRepository.findByLeadId(requestingUserId)
                        .stream()
                        .filter(t -> t.getTeamVisibility() == VisibilityType.PRIVATE)
                        .forEach(t -> accessiblePrivate.add(t.getId()));
                if (roles != null && roles.contains("DEPARTMENT_LEADER")) {
                    departmentRepository.findByManagerId(requestingUserId)
                            .forEach(dept ->
                                teamRepository.findByDepartmentId(dept.getId())
                                        .stream()
                                        .filter(t -> t.getTeamVisibility() == VisibilityType.PRIVATE)
                                        .forEach(t -> accessiblePrivate.add(t.getId()))
                            );
                }
            }
        }

        return teamRepository.findAll().stream()
                .filter(t -> t.getTeamVisibility() == VisibilityType.PUBLIC
                        || accessiblePrivate.contains(t.getId()))
                .map(t -> toResponse(t, requestingUserId))
                .collect(Collectors.toList());
    }

    public List<TeamResponse> searchTeams(String query, String requestingUserId, List<String> roles) {
        boolean isCeo = roles != null && roles.contains("CEO");
        java.util.Set<String> accessiblePrivate = new java.util.HashSet<>();

        if (requestingUserId != null && !requestingUserId.isBlank()) {
            if (isCeo) {
                teamRepository.findByTeamVisibility(VisibilityType.PRIVATE)
                        .forEach(t -> accessiblePrivate.add(t.getId()));
            } else {
                userTeamRepository.findByUserId(requestingUserId)
                        .forEach(ut -> accessiblePrivate.add(ut.getTeamId()));
                teamRepository.findByLeadId(requestingUserId)
                        .stream()
                        .filter(t -> t.getTeamVisibility() == VisibilityType.PRIVATE)
                        .forEach(t -> accessiblePrivate.add(t.getId()));
                if (roles != null && roles.contains("DEPARTMENT_LEADER")) {
                    departmentRepository.findByManagerId(requestingUserId)
                            .forEach(dept ->
                                teamRepository.findByDepartmentId(dept.getId())
                                        .stream()
                                        .filter(t -> t.getTeamVisibility() == VisibilityType.PRIVATE)
                                        .forEach(t -> accessiblePrivate.add(t.getId()))
                            );
                }
            }
        }

        return teamRepository.findByNameContainingIgnoreCase(query).stream()
                .filter(t -> t.getTeamVisibility() == VisibilityType.PUBLIC
                        || accessiblePrivate.contains(t.getId()))
                .map(t -> toResponse(t, requestingUserId))
                .collect(Collectors.toList());
    }

    @Deprecated
    public List<TeamResponse> searchTeams(String query, String requestingUserId) {
        return searchTeams(query, requestingUserId, null);
    }

    public TeamResponse updateTeam(String teamId, TeamRequest request,
                                   String requestingUserId, List<String> roles) {
        Team team = findById(teamId);
        assertCanEdit(team, requestingUserId, roles);

        String oldSnapshot = toJson(team);

        // Handle department change — normalise empty → null
        String newDeptId = (request.getDepartmentId() != null && !request.getDepartmentId().isBlank())
                ? request.getDepartmentId()
                : null;
        String oldDeptId = team.getDepartmentId();

        boolean deptChanged = !java.util.Objects.equals(oldDeptId, newDeptId);
        if (deptChanged) {
            boolean isAdmin = roles.contains("CEO");
            boolean isDeptManager = roles.contains("DEPARTMENT_LEADER")
                    && oldDeptId != null
                    && departmentRepository.findById(oldDeptId)
                            .map(d -> requestingUserId.equals(d.getManagerId()))
                            .orElse(false);
            if (!isAdmin && !isDeptManager) {
                throw new AccessDeniedException(
                        "Only admins or department managers can move a team to a different department.");
            }
            if (newDeptId != null) {
                departmentRepository.findById(newDeptId)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Department not found: " + newDeptId));
            }
        }

        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team.setDepartmentId(newDeptId);

        if (request.getLeadId() != null) {
            String previousLeadId = team.getLeadId();
            String newLeadId = request.getLeadId().isBlank() ? null : request.getLeadId();
            if (newLeadId != null && !newLeadId.equals(previousLeadId)) {
                if (previousLeadId != null && !previousLeadId.isBlank()) {
                    userServiceClient.revokeLeaderRole(previousLeadId, "TEAM_LEADER");
                }
                userServiceClient.assignLeaderRole(newLeadId, "TEAM_LEADER");
                if (!userTeamRepository.existsByUserIdAndTeamId(newLeadId, team.getId())) {
                    userTeamRepository.save(UserTeam.builder()
                            .userId(newLeadId).teamId(team.getId())
                            .joinedAt(LocalDateTime.now()).build());
                }
            }
            team.setLeadId(newLeadId);
        }

        if (request.getAvatarUrl() != null)
            team.setAvatarUrl(request.getAvatarUrl().isBlank() ? null : request.getAvatarUrl());
        if (request.getBannerUrl() != null)
            team.setBannerUrl(request.getBannerUrl().isBlank() ? null : request.getBannerUrl());
        if (request.getTeamVisibility() != null)
            team.setTeamVisibility(request.getTeamVisibility());
        team.setUpdatedAt(LocalDateTime.now());

        Team saved = teamRepository.save(team);

        String updaterLabel = userServiceClient.findById(requestingUserId)
                .map(u -> u.getFirstName() + " " + u.getLastName() + " (" + u.getEmail() + ")")
                .orElse(requestingUserId);

        auditClient.log(requestingUserId, saved.getId(), "TEAM", OrgAuditAction.TEAM_UPDATED,
                "Team '" + saved.getName() + "' updated by " + updaterLabel,
                true, oldSnapshot, toJson(saved));

        return toResponse(saved, requestingUserId);
    }

    public void deleteTeam(String teamId) {
        Team team = findById(teamId);
        String snapshot = toJson(team);
        userTeamRepository.findByTeamId(teamId)
                .forEach(ut -> userTeamRepository.deleteByUserIdAndTeamId(ut.getUserId(), teamId));
        teamRepository.delete(team);
        auditClient.log(null, teamId, "TEAM", OrgAuditAction.TEAM_DELETED,
                "Team '" + team.getName() + "' deleted", true, snapshot, null);
    }

    // ── Lead assignment ───────────────────────────────────────────────────────

    public TeamResponse assignLead(String teamId, AssignLeadRequest request) {
        Team team = findById(teamId);
        String previousLeadId = team.getLeadId();
        team.setLeadId(request.getLeadId());
        team.setUpdatedAt(LocalDateTime.now());
        TeamResponse response = toResponse(teamRepository.save(team), null);

        if (request.getLeadId() != null && !request.getLeadId().isBlank()) {
            if (previousLeadId != null && !previousLeadId.equals(request.getLeadId()))
                userServiceClient.revokeLeaderRole(previousLeadId, "TEAM_LEADER");
            userServiceClient.assignLeaderRole(request.getLeadId(), "TEAM_LEADER");
            if (!userTeamRepository.existsByUserIdAndTeamId(request.getLeadId(), teamId))
                userTeamRepository.save(UserTeam.builder()
                        .userId(request.getLeadId()).teamId(teamId)
                        .joinedAt(LocalDateTime.now()).build());
        }

        auditClient.log(null, teamId, "TEAM", OrgAuditAction.TEAM_LEAD_ASSIGNED,
                "Lead of team '" + team.getName() + "' set to " + request.getLeadId(),
                true, previousLeadId, request.getLeadId());
        return response;
    }

    public TeamResponse removeLead(String teamId) {
        Team team = findById(teamId);
        String previousLeadId = team.getLeadId();
        team.setLeadId(null);
        team.setUpdatedAt(LocalDateTime.now());
        TeamResponse response = toResponse(teamRepository.save(team), null);
        if (previousLeadId != null && !previousLeadId.isBlank())
            userServiceClient.revokeLeaderRole(previousLeadId, "TEAM_LEADER");
        auditClient.log(null, teamId, "TEAM", OrgAuditAction.TEAM_LEAD_REMOVED,
                "Lead removed from team '" + team.getName() + "'",
                true, previousLeadId, null);
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
        auditClient.log(requestingUserId, teamId, "TEAM", OrgAuditAction.TEAM_AVATAR_UPDATED,
                "Avatar updated for team '" + team.getName() + "'", true, old, avatarUrl);
        return toResponse(teamRepository.save(team), requestingUserId);
    }

    public TeamResponse updateBanner(String teamId, String bannerUrl,
                                     String requestingUserId, List<String> roles) {
        Team team = findById(teamId);
        assertCanEdit(team, requestingUserId, roles);
        String old = team.getBannerUrl();
        team.setBannerUrl(bannerUrl);
        team.setUpdatedAt(LocalDateTime.now());
        auditClient.log(requestingUserId, teamId, "TEAM", OrgAuditAction.TEAM_BANNER_UPDATED,
                "Banner updated for team '" + team.getName() + "'", true, old, bannerUrl);
        return toResponse(teamRepository.save(team), requestingUserId);
    }

    // ── Membership (self-service) ─────────────────────────────────────────────

    public TeamResponse joinTeam(String teamId, String userId) {
        Team team = findById(teamId);
        if (team.getTeamVisibility() == VisibilityType.PRIVATE)
            throw new IllegalStateException("This team is private. Contact an admin to join.");
        if (userTeamRepository.existsByUserIdAndTeamId(userId, teamId))
            throw new IllegalStateException("You are already a member of this team.");

        userTeamRepository.save(UserTeam.builder()
                .userId(userId).teamId(teamId).joinedAt(LocalDateTime.now()).build());

        String label = userServiceClient.findById(userId)
                .map(u -> u.getFirstName() + " " + u.getLastName()).orElse(userId);
        auditClient.log(userId, teamId, "TEAM", OrgAuditAction.TEAM_JOINED,
                "User " + label + " joined team '" + team.getName() + "'", true, null, null);
        return toResponse(team, userId);
    }

    public void leaveTeam(String teamId, String userId) {
        Team team = findById(teamId);
        if (!userTeamRepository.existsByUserIdAndTeamId(userId, teamId))
            throw new IllegalStateException("You are not a member of this team.");
        userTeamRepository.deleteByUserIdAndTeamId(userId, teamId);

        String label = userServiceClient.findById(userId)
                .map(u -> u.getFirstName() + " " + u.getLastName()).orElse(userId);
        auditClient.log(userId, teamId, "TEAM", OrgAuditAction.TEAM_LEFT,
                "User " + label + " left team '" + team.getName() + "'", true, null, null);
    }

    public List<TeamResponse> getMyTeams(String userId) {
        return userTeamRepository.findByUserId(userId).stream()
                .map(ut -> teamRepository.findById(ut.getTeamId()).orElse(null))
                .filter(t -> t != null)
                .map(t -> toResponse(t, userId))
                .collect(Collectors.toList());
    }

    /**
     * Returns every team a given user belongs to, together with the date they
     * joined — newest join first. Used by the "Recent Activity" section on a
     * user's profile page (works for any user, not just the caller).
     */
    public List<tn.moonside.organizationservice.dtos.responses.TeamMembershipResponse> getUserTeams(
            String userId, String requestingUserId) {
        return userTeamRepository.findByUserId(userId).stream()
                .map(ut -> {
                    Team t = teamRepository.findById(ut.getTeamId()).orElse(null);
                    if (t == null) return null;
                    return tn.moonside.organizationservice.dtos.responses.TeamMembershipResponse.builder()
                            .team(toResponse(t, requestingUserId))
                            .joinedAt(ut.getJoinedAt())
                            .build();
                })
                .filter(m -> m != null)
                .sorted((a, b) -> b.getJoinedAt().compareTo(a.getJoinedAt()))
                .collect(Collectors.toList());
    }

    // ── Members (admin) ───────────────────────────────────────────────────────

    public List<UserTeamResponse> getTeamMembers(String teamId) {
        findById(teamId);
        return userTeamRepository.findByTeamId(teamId).stream()
                .map(ut -> {
                    UserSummary user = userServiceClient.findById(ut.getUserId()).orElse(null);
                    return UserTeamResponse.builder()
                            .id(ut.getId()).userId(ut.getUserId()).teamId(ut.getTeamId())
                            .user(user).joinedAt(ut.getJoinedAt()).build();
                })
                .collect(Collectors.toList());
    }

    public void removeMember(String teamId, String userId) {
        Team team = findById(teamId);
        if (!userTeamRepository.existsByUserIdAndTeamId(userId, teamId))
            throw new IllegalStateException("User is not a member of this team.");
        userTeamRepository.deleteByUserIdAndTeamId(userId, teamId);
        String label = userServiceClient.findById(userId)
                .map(u -> u.getFirstName() + " " + u.getLastName()).orElse(userId);
        auditClient.log(null, teamId, "TEAM", OrgAuditAction.TEAM_MEMBER_REMOVED,
                "User " + label + " removed from team '" + team.getName() + "'",
                true, userId, null);
    }

    public TeamResponse addMember(String teamId, String userId) {
        Team team = findById(teamId);
        if (userTeamRepository.existsByUserIdAndTeamId(userId, teamId))
            throw new IllegalStateException("User is already a member of this team.");
        userTeamRepository.save(UserTeam.builder()
                .userId(userId).teamId(teamId).joinedAt(LocalDateTime.now()).build());
        String label = userServiceClient.findById(userId)
                .map(u -> u.getFirstName() + " " + u.getLastName()).orElse(userId);
        auditClient.log(null, teamId, "TEAM", OrgAuditAction.TEAM_MEMBER_ADDED,
                "User " + label + " added to team '" + team.getName() + "'", true, null, userId);
        return toResponse(team, userId);
    }

    public TeamResponse assignMemberToTeam(String teamId, String userId,
                                            String requestingUserId, List<String> roles) {
        Team team = findById(teamId);
        assertCanAssignMember(team, requestingUserId, roles);
        if (!userTeamRepository.existsByUserIdAndTeamId(userId, teamId))
            userTeamRepository.save(UserTeam.builder()
                    .userId(userId).teamId(teamId).joinedAt(LocalDateTime.now()).build());
        userServiceClient.assignLeaderRole(userId, "TEAM_MEMBER");
        String assigned = userServiceClient.findById(userId)
                .map(u -> u.getFirstName() + " " + u.getLastName()).orElse(userId);
        String assigner = userServiceClient.findById(requestingUserId)
                .map(u -> u.getFirstName() + " " + u.getLastName()).orElse(requestingUserId);
        auditClient.log(requestingUserId, teamId, "TEAM", OrgAuditAction.TEAM_MEMBER_ASSIGNED,
                "User " + assigned + " assigned to team '" + team.getName() + "' by " + assigner,
                true, null, userId);
        return toResponse(team, requestingUserId);
    }

    // ── Follow / Unfollow ─────────────────────────────────────────────────────

    public TeamResponse followTeam(String teamId, String userId) {
        Team team = findById(teamId);
        if (!followRepository.existsByUserIdAndTargetIdAndTargetType(userId, teamId, FollowTargetType.TEAM)) {
            followRepository.save(Follow.builder()
                    .userId(userId).targetId(teamId).targetType(FollowTargetType.TEAM).build());
            String label = userServiceClient.findById(userId)
                    .map(u -> u.getFirstName() + " " + u.getLastName()).orElse(userId);
            auditClient.log(userId, teamId, "TEAM", OrgAuditAction.TEAM_FOLLOWED,
                    "User " + label + " followed team '" + team.getName() + "'", true, null, null);
        }
        return toResponse(team, userId);
    }

    public TeamResponse unfollowTeam(String teamId, String userId) {
        Team team = findById(teamId);
        followRepository.deleteByUserIdAndTargetIdAndTargetType(userId, teamId, FollowTargetType.TEAM);
        String label = userServiceClient.findById(userId)
                .map(u -> u.getFirstName() + " " + u.getLastName()).orElse(userId);
        auditClient.log(userId, teamId, "TEAM", OrgAuditAction.TEAM_UNFOLLOWED,
                "User " + label + " unfollowed team '" + team.getName() + "'", true, null, null);
        return toResponse(team, userId);
    }

    public List<UserSummary> getTeamFollowers(String teamId) {
        findById(teamId);
        return followRepository.findByTargetIdAndTargetType(teamId, FollowTargetType.TEAM).stream()
                .map(f -> userServiceClient.findById(f.getUserId()).orElse(null))
                .filter(u -> u != null)
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void assertCanAssignMember(Team team, String requestingUserId, List<String> roles) {
        boolean isAdmin      = roles.contains("CEO");
        boolean isHr         = roles.contains("HUMAN_RESOURCES");
        boolean isTeamLeader = roles.contains("TEAM_LEADER")
                && requestingUserId.equals(team.getLeadId());
        // Department manager check — only applies if team has a department
        boolean isDeptManager = false;
        if (team.getDepartmentId() != null && roles.contains("DEPARTMENT_LEADER")) {
            isDeptManager = departmentRepository.findById(team.getDepartmentId())
                    .map(d -> requestingUserId.equals(d.getManagerId()))
                    .orElse(false);
        }
        if (!isAdmin && !isHr && !isTeamLeader && !isDeptManager)
            throw new AccessDeniedException(
                    "Only a Team Leader of this team, its Department Leader, HR, or CEO may assign members.");
    }

    private void assertCanEdit(Team team, String requestingUserId, List<String> roles) {
        boolean isAdmin      = roles.contains("CEO");
        boolean isTeamLeader = roles.contains("TEAM_LEADER")
                && requestingUserId.equals(team.getLeadId());
        // Department manager check — only applies if team belongs to a department
        boolean isDeptManager = false;
        if (team.getDepartmentId() != null && roles.contains("DEPARTMENT_LEADER")) {
            isDeptManager = departmentRepository.findById(team.getDepartmentId())
                    .map(d -> requestingUserId.equals(d.getManagerId()))
                    .orElse(false);
        }
        if (!isAdmin && !isTeamLeader && !isDeptManager)
            throw new AccessDeniedException("You are not authorized to modify this team.");
    }

    private Team findById(String id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + id));
    }

    private String toJson(Team t) {
        return "{\"id\":\"" + t.getId() + "\""
                + ",\"name\":\"" + esc(t.getName()) + "\""
                + ",\"departmentId\":" + (t.getDepartmentId() == null ? "null" : "\"" + t.getDepartmentId() + "\"")
                + ",\"leadId\":" + (t.getLeadId() == null ? "null" : "\"" + t.getLeadId() + "\"")
                + ",\"visibility\":\"" + t.getTeamVisibility() + "\""
                + "}";
    }

    private String esc(String s) { return s == null ? "" : s.replace("\"", "\\\""); }

    public TeamResponse toResponse(Team team, String requestingUserId) {
        UserSummary lead = team.getLeadId() != null
                ? userServiceClient.findById(team.getLeadId()).orElse(null)
                : null;

        long memberCount  = userTeamRepository.countByTeamId(team.getId());
        boolean isMember  = requestingUserId != null
                && userTeamRepository.existsByUserIdAndTeamId(requestingUserId, team.getId());
        boolean isFollowing = requestingUserId != null
                && followRepository.existsByUserIdAndTargetIdAndTargetType(
                        requestingUserId, team.getId(), FollowTargetType.TEAM);
        long followerCount = followRepository.countByTargetIdAndTargetType(
                team.getId(), FollowTargetType.TEAM);

        // Safe null-check — independent teams have no department
        String departmentName = team.getDepartmentId() != null
                ? departmentRepository.findById(team.getDepartmentId())
                        .map(Department::getName).orElse(null)
                : null;

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