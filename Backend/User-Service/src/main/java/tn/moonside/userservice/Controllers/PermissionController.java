package tn.moonside.userservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.moonside.userservice.dtos.requests.PermissionRequest;
import tn.moonside.userservice.dtos.responses.ApiResponse;
import tn.moonside.userservice.dtos.responses.PermissionResponse;
import tn.moonside.userservice.entities.TypeScope;
import tn.moonside.userservice.security.AppPermission;
import tn.moonside.userservice.security.RequiresPermission;
import tn.moonside.userservice.services.PermissionService;

import java.util.List;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    /** Create a permission — requires PERMISSION_CREATE permission */
    @PostMapping
    @RequiresPermission(AppPermission.PERMISSION_CREATE)
    public ResponseEntity<ApiResponse<PermissionResponse>> createPermission(
            @Valid @RequestBody PermissionRequest request) {
        PermissionResponse permission = permissionService.createPermission(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(permission, "Permission created successfully"));
    }

    /** List all permissions (optionally filtered by scope) — requires PERMISSION_READ_ALL permission */
    @GetMapping
    @RequiresPermission(AppPermission.PERMISSION_READ_ALL)
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> getAllPermissions(
            @RequestParam(required = false) TypeScope scopeType) {
        if (scopeType != null) {
            return ResponseEntity.ok(ApiResponse.success(permissionService.getPermissionsByScopeType(scopeType)));
        }
        return ResponseEntity.ok(ApiResponse.success(permissionService.getAllPermissions()));
    }

    /** Read a specific permission — requires PERMISSION_READ permission */
    @GetMapping("/{id}")
    @RequiresPermission(AppPermission.PERMISSION_READ)
    public ResponseEntity<ApiResponse<PermissionResponse>> getPermissionById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(permissionService.getPermissionById(id)));
    }

    /** Update a permission — requires PERMISSION_UPDATE permission */
    @PutMapping("/{id}")
    @RequiresPermission(AppPermission.PERMISSION_UPDATE)
    public ResponseEntity<ApiResponse<PermissionResponse>> updatePermission(
            @PathVariable String id,
            @Valid @RequestBody PermissionRequest request) {
        PermissionResponse updated = permissionService.updatePermission(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Permission updated successfully"));
    }

    /** Delete a permission — requires PERMISSION_DELETE permission */
    @DeleteMapping("/{id}")
    @RequiresPermission(AppPermission.PERMISSION_DELETE)
    public ResponseEntity<ApiResponse<Void>> deletePermission(@PathVariable String id) {
        permissionService.deletePermission(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Permission deleted successfully"));
    }
}
