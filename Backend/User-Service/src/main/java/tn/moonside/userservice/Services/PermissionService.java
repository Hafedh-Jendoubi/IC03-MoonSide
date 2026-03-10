package tn.moonside.userservice.Services;

import tn.moonside.userservice.Dtos.*;
import tn.moonside.userservice.Exceptions.ResourceNotFoundException;
import tn.moonside.userservice.Exceptions.DuplicateResourceException;
import tn.moonside.userservice.Entities.Permission;
import tn.moonside.userservice.Repositories.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService implements IPermissionService{

    private final PermissionRepository permissionRepository;

    @Transactional
    public PermissionDTO createPermission(PermissionCreateDTO permissionCreateDTO) {
        log.info("Creating new permission with action: {} and scope: {}",
                permissionCreateDTO.getAction(), permissionCreateDTO.getScopeType());

        // Check if permission already exists
        if (permissionRepository.existsByActionAndScopeType(
                permissionCreateDTO.getAction(), permissionCreateDTO.getScopeType())) {
            throw new DuplicateResourceException(
                    "Permission with action " + permissionCreateDTO.getAction() +
                            " and scope " + permissionCreateDTO.getScopeType() + " already exists");
        }

        // Create new permission
        Permission permission = Permission.builder()
                .permissionId(UUID.randomUUID())
                .action(permissionCreateDTO.getAction())
                .scopeType(permissionCreateDTO.getScopeType())
                .description(permissionCreateDTO.getDescription())
                .createdAt(LocalDateTime.now())
                .build();

        Permission savedPermission = permissionRepository.save(permission);
        log.info("Permission created successfully with id: {}", savedPermission.getPermissionId());

        return mapToDTO(savedPermission);
    }

    @Transactional(readOnly = true)
    public PermissionDTO getPermissionById(UUID permissionId) {
        log.info("Fetching permission with id: {}", permissionId);

        Permission permission = permissionRepository.findByPermissionId(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with id: " + permissionId));

        return mapToDTO(permission);
    }

    @Transactional(readOnly = true)
    public PermissionDTO getPermissionByActionAndScope(String action, String scopeType) {
        log.info("Fetching permission with action: {} and scope: {}", action, scopeType);

        // This would need proper enum conversion
        Permission permission = permissionRepository.findByActionAndScopeType(action, null)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found"));

        return mapToDTO(permission);
    }

    @Transactional(readOnly = true)
    public List<PermissionDTO> getAllPermissions() {
        log.info("Fetching all permissions");

        return permissionRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PermissionDTO updatePermission(UUID permissionId, PermissionCreateDTO permissionUpdateDTO) {
        log.info("Updating permission with id: {}", permissionId);

        Permission permission = permissionRepository.findByPermissionId(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with id: " + permissionId));

        // Update fields
        if (permissionUpdateDTO.getAction() != null) {
            permission.setAction(permissionUpdateDTO.getAction());
        }

        if (permissionUpdateDTO.getScopeType() != null) {
            permission.setScopeType(permissionUpdateDTO.getScopeType());
        }

        if (permissionUpdateDTO.getDescription() != null) {
            permission.setDescription(permissionUpdateDTO.getDescription());
        }

        Permission updatedPermission = permissionRepository.save(permission);
        log.info("Permission updated successfully with id: {}", updatedPermission.getPermissionId());

        return mapToDTO(updatedPermission);
    }

    @Transactional
    public void deletePermission(UUID permissionId) {
        log.info("Deleting permission with id: {}", permissionId);

        Permission permission = permissionRepository.findByPermissionId(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with id: " + permissionId));

        permissionRepository.delete(permission);
        log.info("Permission deleted successfully with id: {}", permissionId);
    }

    private PermissionDTO mapToDTO(Permission permission) {
        return PermissionDTO.builder()
                .permissionId(permission.getPermissionId())
                .action(permission.getAction())
                .scopeType(permission.getScopeType())
                .description(permission.getDescription())
                .createdAt(permission.getCreatedAt())
                .build();
    }
}