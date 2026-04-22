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
import tn.moonside.organizationservice.repositories.DepartmentRepository;
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
    private final TeamRepository teamRepository;
    private final UserServiceClient userServiceClient;

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
        DepartmentResponse response = toResponse(departmentRepository.save(dept));

        // Assign DEPARTMENT_LEADER role to the designated manager
        if (request.getManagerId() != null && !request.getManagerId().isBlank()) {
            userServiceClient.assignLeaderRole(request.getManagerId(), "DEPARTMENT_LEADER");
        }

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

    public DepartmentResponse getDepartmentById(String id) {
        Department dept = findById(id);
        return toResponse(dept);
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
        return toResponse(departmentRepository.save(dept));
    }

    public void deleteDepartment(String id) {
        Department dept = findById(id);
        departmentRepository.delete(dept);
    }

    public DepartmentResponse deactivateDepartment(String id) {
        Department dept = findById(id);
        dept.setActive(false);
        dept.setUpdatedAt(LocalDateTime.now());
        return toResponse(departmentRepository.save(dept));
    }

    public DepartmentResponse activateDepartment(String id) {
        Department dept = findById(id);
        dept.setActive(true);
        dept.setUpdatedAt(LocalDateTime.now());
        return toResponse(departmentRepository.save(dept));
    }

    // ── Manager assignment ────────────────────────────────────────────────────

    public DepartmentResponse assignManager(String departmentId, AssignManagerRequest request) {
        Department dept = findById(departmentId);
        String previousManagerId = dept.getManagerId();
        dept.setManagerId(request.getManagerId());
        dept.setUpdatedAt(LocalDateTime.now());
        DepartmentResponse response = toResponse(departmentRepository.save(dept));

        // Revoke role from old manager (if changed) and assign to new one
        if (request.getManagerId() != null && !request.getManagerId().isBlank()) {
            if (previousManagerId != null && !previousManagerId.equals(request.getManagerId())) {
                userServiceClient.revokeLeaderRole(previousManagerId, "DEPARTMENT_LEADER");
            }
            userServiceClient.assignLeaderRole(request.getManagerId(), "DEPARTMENT_LEADER");
        }

        return response;
    }

    public DepartmentResponse removeManager(String departmentId) {
        Department dept = findById(departmentId);
        String previousManagerId = dept.getManagerId();
        dept.setManagerId(null);
        dept.setUpdatedAt(LocalDateTime.now());
        DepartmentResponse response = toResponse(departmentRepository.save(dept));

        // Revoke DEPARTMENT_LEADER role from former manager
        if (previousManagerId != null && !previousManagerId.isBlank()) {
            userServiceClient.revokeLeaderRole(previousManagerId, "DEPARTMENT_LEADER");
        }

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
        dept.setAvatarUrl(avatarUrl);
        dept.setUpdatedAt(LocalDateTime.now());
        return toResponse(departmentRepository.save(dept));
    }

    /**
     * Update or remove the department banner.
     * Access: ADMIN or the department manager.
     */
    public DepartmentResponse updateBanner(String id, String bannerUrl,
                                           String requestingUserId, List<String> roles) {
        Department dept = findById(id);
        assertCanEdit(dept, requestingUserId, roles);
        dept.setBannerUrl(bannerUrl);
        dept.setUpdatedAt(LocalDateTime.now());
        return toResponse(departmentRepository.save(dept));
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
        UserSummary manager = dept.getManagerId() != null
                ? userServiceClient.findById(dept.getManagerId()).orElse(null)
                : null;

        long teamCount = teamRepository.findByDepartmentId(dept.getId()).size();

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
                .createdAt(dept.getCreatedAt())
                .updatedAt(dept.getUpdatedAt())
                .build();
    }
}
