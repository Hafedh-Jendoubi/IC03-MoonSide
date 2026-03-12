package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.requests.PermissionRequest;
import tn.moonside.userservice.dtos.responses.PermissionResponse;
import tn.moonside.userservice.entities.TypeScope;

import java.util.List;

public interface PermissionService {
    PermissionResponse createPermission(PermissionRequest request);
    PermissionResponse getPermissionById(String id);
    List<PermissionResponse> getAllPermissions();
    List<PermissionResponse> getPermissionsByScopeType(TypeScope scopeType);
    PermissionResponse updatePermission(String id, PermissionRequest request);
    void deletePermission(String id);
}