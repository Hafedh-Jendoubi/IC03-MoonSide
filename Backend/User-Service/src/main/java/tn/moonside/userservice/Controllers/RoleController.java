package tn.moonside.userservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.moonside.userservice.dtos.requests.RoleRequest;
import tn.moonside.userservice.dtos.responses.ApiResponse;
import tn.moonside.userservice.dtos.responses.RoleResponse;
import tn.moonside.userservice.security.AppPermission;
import tn.moonside.userservice.security.RequiresPermission;
import tn.moonside.userservice.services.RoleService;

import java.util.List;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    /** Create a new role — requires ROLE_CREATE permission */
    @PostMapping
    @RequiresPermission(AppPermission.ROLE_CREATE)
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(
            @Valid @RequestBody RoleRequest request) {
        RoleResponse role = roleService.createRole(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(role, "Role created successfully"));
    }

    /** List all roles — requires ROLE_READ_ALL permission */
    @GetMapping
    @RequiresPermission(AppPermission.ROLE_READ_ALL)
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        return ResponseEntity.ok(ApiResponse.success(roleService.getAllRoles()));
    }

    /** Read a specific role — requires ROLE_READ permission */
    @GetMapping("/{id}")
    @RequiresPermission(AppPermission.ROLE_READ)
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(roleService.getRoleById(id)));
    }

    /** Update a role — requires ROLE_UPDATE permission */
    @PutMapping("/{id}")
    @RequiresPermission(AppPermission.ROLE_UPDATE)
    public ResponseEntity<ApiResponse<RoleResponse>> updateRole(
            @PathVariable String id,
            @Valid @RequestBody RoleRequest request) {
        RoleResponse updated = roleService.updateRole(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Role updated successfully"));
    }

    /** Delete a role — requires ROLE_DELETE permission */
    @DeleteMapping("/{id}")
    @RequiresPermission(AppPermission.ROLE_DELETE)
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable String id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Role deleted successfully"));
    }

    /** Assign a permission to a role — requires ROLE_ASSIGN_PERMISSION permission */
    @PostMapping("/{roleId}/permissions/{permissionId}")
    @RequiresPermission(AppPermission.ROLE_ASSIGN_PERMISSION)
    public ResponseEntity<ApiResponse<Void>> assignPermission(
            @PathVariable String roleId,
            @PathVariable String permissionId) {
        roleService.assignPermissionToRole(roleId, permissionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Permission assigned to role successfully"));
    }

    /** Revoke a permission from a role — requires ROLE_REVOKE_PERMISSION permission */
    @DeleteMapping("/{roleId}/permissions/{permissionId}")
    @RequiresPermission(AppPermission.ROLE_REVOKE_PERMISSION)
    public ResponseEntity<ApiResponse<Void>> revokePermission(
            @PathVariable String roleId,
            @PathVariable String permissionId) {
        roleService.revokePermissionFromRole(roleId, permissionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Permission revoked from role successfully"));
    }
}
