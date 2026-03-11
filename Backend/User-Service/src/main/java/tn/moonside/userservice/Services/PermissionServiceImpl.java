package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.requests.PermissionRequest;
import tn.moonside.userservice.dtos.responses.PermissionResponse;
import tn.moonside.userservice.exceptions.DuplicateResourceException;
import tn.moonside.userservice.exceptions.ResourceNotFoundException;
import tn.moonside.userservice.entities.Permission;
import tn.moonside.userservice.entities.TypeScope;
import tn.moonside.userservice.repositories.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;

    @Override
    @Transactional
    public PermissionResponse createPermission(PermissionRequest request) {
        if (permissionRepository.existsByActionAndScopeType(request.getAction(), request.getScopeType())) {
            throw new DuplicateResourceException(
                    "Permission already exists: " + request.getAction() + " with scope " + request.getScopeType());
        }

        Permission permission = Permission.builder()
                .action(request.getAction())
                .scopeType(request.getScopeType())
                .description(request.getDescription())
                .build();

        Permission saved = permissionRepository.save(permission);
        log.info("Created permission: {} - {}", saved.getAction(), saved.getScopeType());
        return mapToPermissionResponse(saved);
    }

    @Override
    public PermissionResponse getPermissionById(String id) {
        Permission permission = findPermissionById(id);
        return mapToPermissionResponse(permission);
    }

    @Override
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::mapToPermissionResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermissionResponse> getPermissionsByScopeType(TypeScope scopeType) {
        return permissionRepository.findByScopeType(scopeType).stream()
                .map(this::mapToPermissionResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PermissionResponse updatePermission(String id, PermissionRequest request) {
        Permission permission = findPermissionById(id);

        boolean actionOrScopeChanged = !permission.getAction().equals(request.getAction())
                || !permission.getScopeType().equals(request.getScopeType());

        if (actionOrScopeChanged &&
                permissionRepository.existsByActionAndScopeType(request.getAction(), request.getScopeType())) {
            throw new DuplicateResourceException("Permission already exists with this action and scope");
        }

        permission.setAction(request.getAction());
        permission.setScopeType(request.getScopeType());
        permission.setDescription(request.getDescription());

        Permission updated = permissionRepository.save(permission);
        log.info("Updated permission: {}", updated.getId());
        return mapToPermissionResponse(updated);
    }

    @Override
    @Transactional
    public void deletePermission(String id) {
        findPermissionById(id);
        permissionRepository.deleteById(id);
        log.info("Deleted permission: {}", id);
    }

    private Permission findPermissionById(String id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with id: " + id));
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