package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.requests.RoleRequest;
import tn.moonside.userservice.dtos.responses.PermissionResponse;
import tn.moonside.userservice.dtos.responses.RoleResponse;
import tn.moonside.userservice.exceptions.DuplicateResourceException;
import tn.moonside.userservice.exceptions.ResourceNotFoundException;
import tn.moonside.userservice.entities.Permission;
import tn.moonside.userservice.entities.PermissionRole;
import tn.moonside.userservice.entities.Role;
import tn.moonside.userservice.repositories.PermissionRepository;
import tn.moonside.userservice.repositories.PermissionRoleRepository;
import tn.moonside.userservice.repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRoleRepository permissionRoleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        if (roleRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Role already exists: " + request.getName());
        }

        Role role = Role.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        Role saved = roleRepository.save(role);
        log.info("Created role: {}", saved.getName());
        return mapToRoleResponse(saved, List.of());
    }

    @Override
    public RoleResponse getRoleById(String id) {
        Role role = findRoleById(id);
        List<PermissionResponse> permissions = getPermissionsForRole(id);
        return mapToRoleResponse(role, permissions);
    }

    @Override
    public RoleResponse getRoleByName(String name) {
        Role role = roleRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + name));
        List<PermissionResponse> permissions = getPermissionsForRole(role.getId());
        return mapToRoleResponse(role, permissions);
    }

    @Override
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(role -> {
                    List<PermissionResponse> permissions = getPermissionsForRole(role.getId());
                    return mapToRoleResponse(role, permissions);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RoleResponse updateRole(String id, RoleRequest request) {
        Role role = findRoleById(id);

        if (!role.getName().equals(request.getName()) && roleRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Role name already taken: " + request.getName());
        }

        role.setName(request.getName());
        role.setDescription(request.getDescription());

        Role updated = roleRepository.save(role);
        List<PermissionResponse> permissions = getPermissionsForRole(id);
        log.info("Updated role: {}", updated.getId());
        return mapToRoleResponse(updated, permissions);
    }

    @Override
    @Transactional
    public void deleteRole(String id) {
        findRoleById(id);
        permissionRoleRepository.deleteByRoleId(id);
        roleRepository.deleteById(id);
        log.info("Deleted role: {}", id);
    }

    @Override
    @Transactional
    public void assignPermissionToRole(String roleId, String permissionId) {
        findRoleById(roleId);
        permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found: " + permissionId));

        if (permissionRoleRepository.existsByRoleIdAndPermissionId(roleId, permissionId)) {
            throw new DuplicateResourceException("Permission already assigned to this role");
        }

        PermissionRole permissionRole = PermissionRole.builder()
                .roleId(roleId)
                .permissionId(permissionId)
                .build();

        permissionRoleRepository.save(permissionRole);
        log.info("Assigned permission {} to role {}", permissionId, roleId);
    }

    @Override
    @Transactional
    public void revokePermissionFromRole(String roleId, String permissionId) {
        findRoleById(roleId);
        permissionRoleRepository.deleteByRoleIdAndPermissionId(roleId, permissionId);
        log.info("Revoked permission {} from role {}", permissionId, roleId);
    }

    private Role findRoleById(String id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
    }

    private List<PermissionResponse> getPermissionsForRole(String roleId) {
        return permissionRoleRepository.findByRoleId(roleId).stream()
                .map(pr -> permissionRepository.findById(pr.getPermissionId()).orElse(null))
                .filter(p -> p != null)
                .map(this::mapToPermissionResponse)
                .collect(Collectors.toList());
    }

    private RoleResponse mapToRoleResponse(Role role, List<PermissionResponse> permissions) {
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .createdAt(role.getCreatedAt())
                .permissions(permissions)
                .build();
    }

    private PermissionResponse mapToPermissionResponse(Permission permission) {
        return PermissionResponse.builder()
                .id(permission.getId())
                .action(permission.getAction())
                .scopeType(permission.getScopeType())
                .description(permission.getDescription())
                .createdAt(permission.getCreatedAt())
                .build();
    }
}