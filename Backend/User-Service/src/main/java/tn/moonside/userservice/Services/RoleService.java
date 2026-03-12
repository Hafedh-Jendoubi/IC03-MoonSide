package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.requests.RoleRequest;
import tn.moonside.userservice.dtos.responses.RoleResponse;

import java.util.List;

public interface RoleService {
    RoleResponse createRole(RoleRequest request);
    RoleResponse getRoleById(String id);
    RoleResponse getRoleByName(String name);
    List<RoleResponse> getAllRoles();
    RoleResponse updateRole(String id, RoleRequest request);
    void deleteRole(String id);
    void assignPermissionToRole(String roleId, String permissionId);
    void revokePermissionFromRole(String roleId, String permissionId);
}
