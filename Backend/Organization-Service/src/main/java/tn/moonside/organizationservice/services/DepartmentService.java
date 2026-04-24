package tn.moonside.organizationservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final TeamRepository teamRepository;
    private final UserServiceClient userServiceClient;
    private final FollowRepository followRepository;
    private final AuditLogService auditLogService;

    // ── CRUD ─────────────────────────────────────────────────────────────────

    public DepartmentResponse createDepartment(DepartmentRequest request) {
        String userId = getCurrentUserId();
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
        DepartmentResponse response = toResponse(saved);

        // Assign DEPARTMENT_LEADER role to the designated manager
        if (request.getManagerId() != null && !request.getManagerId().isBlank()) {
            userServiceClient.assignLeaderRole(request.getManagerId(), "DEPARTMENT_LEADER");
        }

        auditLogService.log(userId, saved.getId(), "DEPARTMENT",
                "DEPARTMENT_CREATED",
                "Department '" + saved.getName() + "' created",
                true, null, deptToSnapshot(saved), null);

        return response;
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
        String oldSnapshot = deptToSnapshot(dept);

        boolean isAdmin = roles.contains("CEO");
        boolean isDeptManager = roles.contains("DEPARTMENT_LEADER")
                && requestingUserId.equals(dept.getManagerId());

        if (!isAdmin && !isDeptManager) {
            throw new AccessDeniedException(
                    "You are not authorized to modify this department.");
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
        // Update image URLs if provided (null = keep existing, explicit value = update)
        if (request.getAvatarUrl() != null) {
            dept.setAvatarUrl(request.getAvatarUrl().isBlank() ? null : request.getAvatarUrl());
        }
        if (request.getBannerUrl() != null) {
            dept.setBannerUrl(request.getBannerUrl().isBlank() ? null : request.getBannerUrl());
        }
        dept.setUpdatedAt(LocalDateTime.now());
        Department updated = departmentRepository.save(dept);
        
        auditLogService.log(requestingUserId, updated.getId(), "DEPARTMENT",
                "DEPARTMENT_UPDATED",
                "Department '" + updated.getName() + "' updated",
                true, oldSnapshot, deptToSnapshot(updated), null);
        
        return toResponse(updated);
    }

    public void deleteDepartment(String id) {
        String userId = getCurrentUserId();
        Department dept = findById(id);
        departmentRepository.delete(dept);
        
        auditLogService.log(userId, dept.getId(), "DEPARTMENT",
                "DEPARTMENT_DELETED",
                "Department '" + dept.getName() + "' deleted",
                true, deptToSnapshot(dept), null, null);
    }

    public DepartmentResponse deactivateDepartment(String id) {
        String userId = getCurrentUserId();
        Department dept = findById(id);
        dept.setActive(false);
        dept.setUpdatedAt(LocalDateTime.now());
        Department updated = departmentRepository.save(dept);
        
        auditLogService.log(userId, updated.getId(), "DEPARTMENT",
                "DEPARTMENT_DEACTIVATED",
                "Department '" + updated.getName() + "' deactivated",
                true, null, null, null);
        
        return toResponse(updated);
    }

    public DepartmentResponse activateDepartment(String id) {
        String userId = getCurrentUserId();
        Department dept = findById(id);
        dept.setActive(true);
        dept.setUpdatedAt(LocalDateTime.now());
        Department updated = departmentRepository.save(dept);
        
        auditLogService.log(userId, updated.getId(), "DEPARTMENT",
                "DEPARTMENT_ACTIVATED",
                "Department '" + updated.getName() + "' activated",
                true, null, null, null);
        
        return toResponse(updated);
    }

    // ── Manager assignment ────────────────────────────────────────────────────

    public DepartmentResponse assignManager(String departmentId, AssignManagerRequest request) {
        String userId = getCurrentUserId();
        Department dept = findById(departmentId);
        String previousManagerId = dept.getManagerId();
        dept.setManagerId(request.getManagerId());
        dept.setUpdatedAt(LocalDateTime.now());
        Department updated = departmentRepository.save(dept);
        DepartmentResponse response = toResponse(updated);

        // Revoke role from old manager (if changed) and assign to new one
        if (request.getManagerId() != null && !request.getManagerId().isBlank()) {
            if (previousManagerId != null && !previousManagerId.equals(request.getManagerId())) {
                userServiceClient.revokeLeaderRole(previousManagerId, "DEPARTMENT_LEADER");
            }
            userServiceClient.assignLeaderRole(request.getManagerId(), "DEPARTMENT_LEADER");
        }

        auditLogService.log(userId, updated.getId(), "DEPARTMENT",
                "DEPARTMENT_MANAGER_ASSIGNED",
                "Manager assigned to department '" + updated.getName() + "'",
                true, previousManagerId, request.getManagerId(), null);

        return response;
    }

    public DepartmentResponse removeManager(String departmentId) {
        String userId = getCurrentUserId();
        Department dept = findById(departmentId);
        String previousManagerId = dept.getManagerId();
        dept.setManagerId(null);
        dept.setUpdatedAt(LocalDateTime.now());
        Department updated = departmentRepository.save(dept);
        DepartmentResponse response = toResponse(updated);

        // Revoke DEPARTMENT_LEADER role from former manager
        if (previousManagerId != null && !previousManagerId.isBlank()) {
            userServiceClient.revokeLeaderRole(previousManagerId, "DEPARTMENT_LEADER");
        }

        auditLogService.log(userId, updated.getId(), "DEPARTMENT",
                "DEPARTMENT_MANAGER_REMOVED",
                "Manager removed from department '" + updated.getName() + "'",
                true, previousManagerId, null, null);

        return response;
    }

    // ── Image management ──────────────────────────────────────────────────────

    /**
     * Update or remove the department avatar.
     * Access: ADMIN or the department manager.
     */
    public DepartmentResponse updateAvatar(String id, String avatarUrl,
                                           String requestingUserId, List<String> roles) {
        Department dept = findById(id);
        assertCanEdit(dept, requestingUserId, roles);
        String oldAvatar = dept.getAvatarUrl();
        dept.setAvatarUrl(avatarUrl);
        dept.setUpdatedAt(LocalDateTime.now());
        Department updated = departmentRepository.save(dept);
        
        String action = (avatarUrl == null) ? "AVATAR_DELETE" : "AVATAR_UPDATE";
        String desc = (avatarUrl == null)
                ? "Avatar removed from department '" + updated.getName() + "'"
                : "Avatar updated for department '" + updated.getName() + "'";
        
        auditLogService.log(requestingUserId, updated.getId(), "DEPARTMENT",
                action, desc, true, oldAvatar, avatarUrl, null);
        
        return toResponse(updated);
    }

    /**
     * Update or remove the department banner.
     * Access: ADMIN or the department manager.
     */
    public DepartmentResponse updateBanner(String id, String bannerUrl,
                                           String requestingUserId, List<String> roles) {
        Department dept = findById(id);
        assertCanEdit(dept, requestingUserId, roles);
        String oldBanner = dept.getBannerUrl();
        dept.setBannerUrl(bannerUrl);
        dept.setUpdatedAt(LocalDateTime.now());
        Department updated = departmentRepository.save(dept);
        
        String action = (bannerUrl == null) ? "BANNER_DELETE" : "BANNER_UPDATE";
        String desc = (bannerUrl == null)
                ? "Banner removed from department '" + updated.getName() + "'"
                : "Banner updated for department '" + updated.getName() + "'";
        
        auditLogService.log(requestingUserId, updated.getId(), "DEPARTMENT",
                action, desc, true, oldBanner, bannerUrl, null);
        
        return toResponse(updated);
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
        }
        return toResponse(dept, userId);
    }

    public DepartmentResponse unfollowDepartment(String departmentId, String userId) {
        Department dept = findById(departmentId);
        followRepository.deleteByUserIdAndTargetIdAndTargetType(
                userId, departmentId, FollowTargetType.DEPARTMENT);
        return toResponse(dept, userId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void assertCanEdit(Department dept, String requestingUserId, List<String> roles) {
        boolean isAdmin = roles.contains("CEO");
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
                .teamCount(teamCount)
                .isFollowing(isFollowing)
                .followerCount(followerCount)
                .createdAt(dept.getCreatedAt())
                .updatedAt(dept.getUpdatedAt())
                .build();
    }

    /** Get the current authenticated user ID */
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "SYSTEM";
    }

    /** Create a JSON snapshot of department details for audit trail */
    private String deptToSnapshot(Department dept) {
        return "{\"name\":\"" + nullSafe(dept.getName()) + "\"" +
               ",\"description\":\"" + nullSafe(dept.getDescription()) + "\"" +
               ",\"managerId\":\"" + nullSafe(dept.getManagerId()) + "\"" +
               ",\"isActive\":" + dept.isActive() + "}";
    }

    private String nullSafe(String s) {
        return s == null ? "" : s.replace("\"", "\\\"");
    }
}
