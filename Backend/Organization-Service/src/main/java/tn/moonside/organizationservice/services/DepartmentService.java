package tn.moonside.organizationservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.moonside.organizationservice.audit.AuditClient;
import tn.moonside.organizationservice.audit.OrgAuditAction;
import tn.moonside.organizationservice.config.UserServiceClient;
import tn.moonside.organizationservice.dtos.requests.AssignManagerRequest;
import tn.moonside.organizationservice.dtos.requests.DepartmentRequest;
import tn.moonside.organizationservice.dtos.responses.DepartmentResponse;
import tn.moonside.organizationservice.dtos.responses.UserSummary;
import tn.moonside.organizationservice.entities.Department;
import tn.moonside.organizationservice.entities.Follow;
import tn.moonside.organizationservice.enums.FollowTargetType;
import tn.moonside.organizationservice.repositories.DepartmentRepository;
import tn.moonside.organizationservice.repositories.FollowRepository;
import tn.moonside.organizationservice.repositories.TeamRepository;

import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final TeamRepository       teamRepository;
    private final UserServiceClient    userServiceClient;
    private final FollowRepository     followRepository;
    private final AuditClient          auditClient;          // ← NEW

    // ── CRUD ─────────────────────────────────────────────────────────────────

    public DepartmentResponse createDepartment(DepartmentRequest request) {
        Department dept = Department.builder()
                .name(request.getName())
                .description(request.getDescription())
                .managerId(request.getManagerId())
                .avatarUrl(request.getAvatarUrl())
                .bannerUrl(request.getBannerUrl())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        Department saved = departmentRepository.save(dept);

        if (request.getManagerId() != null && !request.getManagerId().isBlank()) {
            userServiceClient.assignLeaderRole(request.getManagerId(), "DEPARTMENT_LEADER");
        }

        auditClient.log(
                null,
                saved.getId(),
                "DEPARTMENT",
                OrgAuditAction.DEPARTMENT_CREATED,
                "Department '" + saved.getName() + "' created",
                true,
                null,
                toJson(saved));

        return toResponse(saved);
    }

    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DepartmentResponse> getActiveDepartments() {
        return departmentRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DepartmentResponse getDepartmentById(String id, String requestingUserId) {
        Department dept = findById(id);
        return toResponse(dept, requestingUserId);
    }

    /**
     * Update a department.
     * Access rules:
     *  - ADMIN              → always allowed (can also change managerId)
     *  - DEPARTMENT_MANAGER → only if they manage this specific department
     *                         (cannot change managerId — admin-only action)
     */
    public DepartmentResponse updateDepartment(String id, DepartmentRequest request,
                                               String requestingUserId, List<String> roles) {
        Department dept = findById(id);
        String oldSnapshot = toJson(dept);

        boolean isAdmin      = roles.contains("CEO");
        boolean isDeptManager = roles.contains("DEPARTMENT_LEADER")
                && requestingUserId.equals(dept.getManagerId());

        if (!isAdmin && !isDeptManager) {
            throw new AccessDeniedException("You are not authorized to modify this department.");
        }

        dept.setName(request.getName());
        dept.setDescription(request.getDescription());
        // Only admins may reassign the manager
        if (isAdmin && request.getManagerId() != null) {
            String previousManagerId = dept.getManagerId();
            String newManagerId = request.getManagerId();
            if (!newManagerId.equals(previousManagerId)) {
                if (previousManagerId != null && !previousManagerId.isBlank()) {
                    userServiceClient.revokeLeaderRole(previousManagerId, "DEPARTMENT_LEADER");
                }
                userServiceClient.assignLeaderRole(newManagerId, "DEPARTMENT_LEADER");
            }
            dept.setManagerId(newManagerId);
        }
        if (request.getAvatarUrl() != null) {
            dept.setAvatarUrl(request.getAvatarUrl().isBlank() ? null : request.getAvatarUrl());
        }
        if (request.getBannerUrl() != null) {
            dept.setBannerUrl(request.getBannerUrl().isBlank() ? null : request.getBannerUrl());
        }
        if (request.getMembersPublic() != null) {
            dept.setMembersPublic(request.getMembersPublic());
        }
        dept.setUpdatedAt(LocalDateTime.now());
        Department saved = departmentRepository.save(dept);

        String updaterLabel = userServiceClient.findById(requestingUserId)
                .map(u -> u.getFirstName() + " " + u.getLastName() + " (" + u.getEmail() + ")")
                .orElse(requestingUserId);

        auditClient.log(
                requestingUserId,
                saved.getId(),
                "DEPARTMENT",
                OrgAuditAction.DEPARTMENT_UPDATED,
                "Department '" + saved.getName() + "' updated by user " + updaterLabel,
                true,
                oldSnapshot,
                toJson(saved));

        return toResponse(saved);
    }

    public void deleteDepartment(String id) {
        Department dept = findById(id);
        String snapshot = toJson(dept);
        departmentRepository.delete(dept);

        auditClient.log(
                null,
                id,
                "DEPARTMENT",
                OrgAuditAction.DEPARTMENT_DELETED,
                "Department '" + dept.getName() + "' deleted",
                true,
                snapshot,
                null);
    }

    public DepartmentResponse deactivateDepartment(String id) {
        Department dept = findById(id);
        dept.setActive(false);
        dept.setUpdatedAt(LocalDateTime.now());
        Department saved = departmentRepository.save(dept);

        auditClient.log(
                null,
                id,
                "DEPARTMENT",
                OrgAuditAction.DEPARTMENT_DEACTIVATED,
                "Department '" + dept.getName() + "' deactivated",
                true,
                null,
                null);

        return toResponse(saved);
    }

    public DepartmentResponse activateDepartment(String id) {
        Department dept = findById(id);
        dept.setActive(true);
        dept.setUpdatedAt(LocalDateTime.now());
        Department saved = departmentRepository.save(dept);

        auditClient.log(
                null,
                id,
                "DEPARTMENT",
                OrgAuditAction.DEPARTMENT_ACTIVATED,
                "Department '" + dept.getName() + "' activated",
                true,
                null,
                null);

        return toResponse(saved);
    }

    // ── Manager assignment ────────────────────────────────────────────────────

    public DepartmentResponse assignManager(String departmentId, AssignManagerRequest request) {
        Department dept = findById(departmentId);
        String previousManagerId = dept.getManagerId();
        dept.setManagerId(request.getManagerId());
        dept.setUpdatedAt(LocalDateTime.now());
        DepartmentResponse response = toResponse(departmentRepository.save(dept));

        if (request.getManagerId() != null && !request.getManagerId().isBlank()) {
            if (previousManagerId != null && !previousManagerId.equals(request.getManagerId())) {
                userServiceClient.revokeLeaderRole(previousManagerId, "DEPARTMENT_LEADER");
            }
            userServiceClient.assignLeaderRole(request.getManagerId(), "DEPARTMENT_LEADER");
        }

        auditClient.log(
                null,
                departmentId,
                "DEPARTMENT",
                OrgAuditAction.DEPARTMENT_MANAGER_ASSIGNED,
                "Manager of department '" + dept.getName() + "' assigned to user "
                        + request.getManagerId() + " (was: " + previousManagerId + ")",
                true,
                previousManagerId,
                request.getManagerId());

        return response;
    }

    public DepartmentResponse removeManager(String departmentId) {
        Department dept = findById(departmentId);
        String previousManagerId = dept.getManagerId();
        dept.setManagerId(null);
        dept.setUpdatedAt(LocalDateTime.now());
        DepartmentResponse response = toResponse(departmentRepository.save(dept));

        if (previousManagerId != null && !previousManagerId.isBlank()) {
            userServiceClient.revokeLeaderRole(previousManagerId, "DEPARTMENT_LEADER");
        }

        auditClient.log(
                null,
                departmentId,
                "DEPARTMENT",
                OrgAuditAction.DEPARTMENT_MANAGER_REMOVED,
                "Manager removed from department '" + dept.getName()
                        + "' (was: " + previousManagerId + ")",
                true,
                previousManagerId,
                null);

        return response;
    }

    // ── Image management ──────────────────────────────────────────────────────

    public DepartmentResponse updateAvatar(String id, String avatarUrl,
                                           String requestingUserId, List<String> roles) {
        Department dept = findById(id);
        assertCanEdit(dept, requestingUserId, roles);
        String old = dept.getAvatarUrl();
        dept.setAvatarUrl(avatarUrl);
        dept.setUpdatedAt(LocalDateTime.now());
        Department saved = departmentRepository.save(dept);

        auditClient.log(
                requestingUserId,
                id,
                "DEPARTMENT",
                OrgAuditAction.DEPARTMENT_AVATAR_UPDATED,
                "Avatar updated for department '" + dept.getName() + "'",
                true,
                old,
                avatarUrl);

        return toResponse(saved);
    }

    public DepartmentResponse updateBanner(String id, String bannerUrl,
                                           String requestingUserId, List<String> roles) {
        Department dept = findById(id);
        assertCanEdit(dept, requestingUserId, roles);
        String old = dept.getBannerUrl();
        dept.setBannerUrl(bannerUrl);
        dept.setUpdatedAt(LocalDateTime.now());
        Department saved = departmentRepository.save(dept);

        auditClient.log(
                requestingUserId,
                id,
                "DEPARTMENT",
                OrgAuditAction.DEPARTMENT_BANNER_UPDATED,
                "Banner updated for department '" + dept.getName() + "'",
                true,
                old,
                bannerUrl);

        return toResponse(saved);
    }

    // ── Follow / Unfollow ─────────────────────────────────────────────────────

    public DepartmentResponse followDepartment(String departmentId, String userId) {
        Department dept = findById(departmentId);
        if (!followRepository.existsByUserIdAndTargetIdAndTargetType(
                userId, departmentId, FollowTargetType.DEPARTMENT)) {
            followRepository.save(Follow.builder()
                    .userId(userId)
                    .targetId(departmentId)
                    .targetType(FollowTargetType.DEPARTMENT)
                    .build());

            String followerLabel = userServiceClient.findById(userId)
                    .map(u -> u.getFirstName() + " " + u.getLastName() + " (" + u.getEmail() + ")")
                    .orElse(userId);

            auditClient.log(
                    userId,
                    departmentId,
                    "DEPARTMENT",
                    OrgAuditAction.DEPARTMENT_FOLLOWED,
                    "User " + followerLabel + " followed department '" + dept.getName() + "'",
                    true,
                    null,
                    null);
        }
        return toResponse(dept, userId);
    }

    public List<UserSummary> getDepartmentFollowers(String departmentId) {
        findById(departmentId); // validate exists
        return followRepository.findByTargetIdAndTargetType(departmentId, FollowTargetType.DEPARTMENT)
                .stream()
                .map(f -> userServiceClient.findById(f.getUserId()).orElse(null))
                .filter(u -> u != null)
                .collect(Collectors.toList());
    }

    public DepartmentResponse unfollowDepartment(String departmentId, String userId) {
        Department dept = findById(departmentId);
        followRepository.deleteByUserIdAndTargetIdAndTargetType(
                userId, departmentId, FollowTargetType.DEPARTMENT);

        String unfollowerLabel = userServiceClient.findById(userId)
                .map(u -> u.getFirstName() + " " + u.getLastName() + " (" + u.getEmail() + ")")
                .orElse(userId);

        auditClient.log(
                userId,
                departmentId,
                "DEPARTMENT",
                OrgAuditAction.DEPARTMENT_UNFOLLOWED,
                "User " + unfollowerLabel + " unfollowed department '" + dept.getName() + "'",
                true,
                null,
                null);

        return toResponse(dept, userId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void assertCanEdit(Department dept, String requestingUserId, List<String> roles) {
        boolean isAdmin      = roles.contains("CEO");
        boolean isDeptManager = roles.contains("DEPARTMENT_LEADER")
                && requestingUserId.equals(dept.getManagerId());
        if (!isAdmin && !isDeptManager) {
            throw new AccessDeniedException("You are not authorized to modify this department.");
        }
    }

    private Department findById(String id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + id));
    }

    /** Minimal JSON snapshot for audit old/newValue fields. */
    private String toJson(Department d) {
        return "{\"id\":\"" + d.getId() + "\""
                + ",\"name\":\"" + esc(d.getName()) + "\""
                + ",\"managerId\":" + (d.getManagerId() == null ? "null" : "\"" + d.getManagerId() + "\"")
                + ",\"active\":" + d.isActive()
                + "}";
    }

    private String esc(String s) { return s == null ? "" : s.replace("\"", "\\\""); }

    public DepartmentResponse toResponse(Department dept) {
        return toResponse(dept, null);
    }

    public DepartmentResponse toResponse(Department dept, String requestingUserId) {
        UserSummary manager = dept.getManagerId() != null
                ? userServiceClient.findById(dept.getManagerId()).orElse(null)
                : null;

        long teamCount = teamRepository.findByDepartmentId(dept.getId()).size();

        boolean isFollowing = requestingUserId != null &&
                followRepository.existsByUserIdAndTargetIdAndTargetType(
                        requestingUserId, dept.getId(), FollowTargetType.DEPARTMENT);

        long followerCount = followRepository.countByTargetIdAndTargetType(
                dept.getId(), FollowTargetType.DEPARTMENT);

        return DepartmentResponse.builder()
                .id(dept.getId())
                .managerId(dept.getManagerId())
                .manager(manager)
                .name(dept.getName())
                .description(dept.getDescription())
                .avatarUrl(dept.getAvatarUrl())
                .bannerUrl(dept.getBannerUrl())
                .isActive(dept.isActive())
                .membersPublic(dept.isMembersPublic())
                .teamCount(teamCount)
                .isFollowing(isFollowing)
                .followerCount(followerCount)
                .createdAt(dept.getCreatedAt())
                .updatedAt(dept.getUpdatedAt())
                .build();
    }
}
