package tn.moonside.userservice.Services;

import tn.moonside.userservice.Dtos.*;
import tn.moonside.userservice.Exceptions.ResourceNotFoundException;
import tn.moonside.userservice.Exceptions.DuplicateResourceException;
import tn.moonside.userservice.Entities.Role;
import tn.moonside.userservice.Entities.Permission;
import tn.moonside.userservice.Repositories.RoleRepository;
import tn.moonside.userservice.Repositories.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleService implements IRoleService {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional
    public RoleDTO createRole(RoleCreateDTO roleCreateDTO) {
        log.info("Creating new role with name: {}", roleCreateDTO.getName());

        // Check if role already exists
        if (roleRepository.existsByName(roleCreateDTO.getName())) {
            throw new DuplicateResourceException("Role with name " + roleCreateDTO.getName() + " already exists");
        }

        // Create new role
        Role role = Role.builder()
                .roleId(UUID.randomUUID())
                .name(roleCreateDTO.getName())
                .description(roleCreateDTO.getDescription())
                .createdAt(LocalDateTime.now())
                .permissions(new HashSet<>())
                .build();

        // Assign permissions if provided
        if (roleCreateDTO.getPermissionIds() != null && !roleCreateDTO.getPermissionIds().isEmpty()) {
            Set<Permission> permissions = roleCreateDTO.getPermissionIds().stream()
                    .map(permissionId -> permissionRepository.findByPermissionId(permissionId)
                            .orElseThrow(() -> new ResourceNotFoundException("Permission not found with id: " + permissionId)))
                    .collect(Collectors.toSet());
            role.setPermissions(permissions);
        }

        Role savedRole = roleRepository.save(role);
        log.info("Role created successfully with id: {}", savedRole.getRoleId());

        return mapToDTO(savedRole);
    }

    @Transactional(readOnly = true)
    public RoleDTO getRoleById(UUID roleId) {
        log.info("Fetching role with id: {}", roleId);

        Role role = roleRepository.findByRoleId(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));

        return mapToDTO(role);
    }

    @Transactional(readOnly = true)
    public RoleDTO getRoleByName(String name) {
        log.info("Fetching role with name: {}", name);

        Role role = roleRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with name: " + name));

        return mapToDTO(role);
    }

    @Transactional(readOnly = true)
    public List<RoleDTO> getAllRoles() {
        log.info("Fetching all roles");

        return roleRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoleDTO updateRole(UUID roleId, RoleCreateDTO roleUpdateDTO) {
        log.info("Updating role with id: {}", roleId);

        Role role = roleRepository.findByRoleId(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));

        // Update fields
        if (roleUpdateDTO.getName() != null) {
            // Check if new name is already taken by another role
            roleRepository.findByName(roleUpdateDTO.getName())
                    .ifPresent(existingRole -> {
                        if (!existingRole.getRoleId().equals(roleId)) {
                            throw new DuplicateResourceException("Role name " + roleUpdateDTO.getName() + " is already taken");
                        }
                    });
            role.setName(roleUpdateDTO.getName());
        }

        if (roleUpdateDTO.getDescription() != null) {
            role.setDescription(roleUpdateDTO.getDescription());
        }

        // Update permissions if provided
        if (roleUpdateDTO.getPermissionIds() != null) {
            Set<Permission> permissions = roleUpdateDTO.getPermissionIds().stream()
                    .map(permissionId -> permissionRepository.findByPermissionId(permissionId)
                            .orElseThrow(() -> new ResourceNotFoundException("Permission not found with id: " + permissionId)))
                    .collect(Collectors.toSet());
            role.setPermissions(permissions);
        }

        Role updatedRole = roleRepository.save(role);
        log.info("Role updated successfully with id: {}", updatedRole.getRoleId());

        return mapToDTO(updatedRole);
    }

    @Transactional
    public void deleteRole(UUID roleId) {
        log.info("Deleting role with id: {}", roleId);

        Role role = roleRepository.findByRoleId(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));

        roleRepository.delete(role);
        log.info("Role deleted successfully with id: {}", roleId);
    }

    @Transactional
    public RoleDTO assignPermissionToRole(UUID roleId, UUID permissionId) {
        log.info("Assigning permission {} to role {}", permissionId, roleId);

        Role role = roleRepository.findByRoleId(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));

        Permission permission = permissionRepository.findByPermissionId(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with id: " + permissionId));

        role.getPermissions().add(permission);
        Role updatedRole = roleRepository.save(role);

        log.info("Permission assigned successfully");
        return mapToDTO(updatedRole);
    }

    @Transactional
    public RoleDTO removePermissionFromRole(UUID roleId, UUID permissionId) {
        log.info("Removing permission {} from role {}", permissionId, roleId);

        Role role = roleRepository.findByRoleId(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));

        role.getPermissions().removeIf(permission -> permission.getPermissionId().equals(permissionId));
        Role updatedRole = roleRepository.save(role);

        log.info("Permission removed successfully");
        return mapToDTO(updatedRole);
    }

    private RoleDTO mapToDTO(Role role) {
        return RoleDTO.builder()
                .roleId(role.getRoleId())
                .name(role.getName())
                .description(role.getDescription())
                .createdAt(role.getCreatedAt())
                .permissions(role.getPermissions().stream()
                        .map(this::mapPermissionToDTO)
                        .collect(Collectors.toSet()))
                .build();
    }

    private PermissionDTO mapPermissionToDTO(Permission permission) {
        return PermissionDTO.builder()
                .permissionId(permission.getPermissionId())
                .action(permission.getAction())
                .scopeType(permission.getScopeType())
                .description(permission.getDescription())
                .createdAt(permission.getCreatedAt())
                .build();
    }
}