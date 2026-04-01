package tn.moonside.userservice.controllers;

import tn.moonside.userservice.dtos.requests.PermissionRequest;
import tn.moonside.userservice.dtos.responses.ApiResponse;
import tn.moonside.userservice.dtos.responses.PermissionResponse;
import tn.moonside.userservice.entities.TypeScope;
import tn.moonside.userservice.services.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @PostMapping
    public ResponseEntity<ApiResponse<PermissionResponse>> createPermission(
            @Valid @RequestBody PermissionRequest request) {
        PermissionResponse permission = permissionService.createPermission(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(permission, "Permission created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> getAllPermissions(
            @RequestParam(required = false) TypeScope scopeType) {
        if (scopeType != null) {
            return ResponseEntity.ok(ApiResponse.success(permissionService.getPermissionsByScopeType(scopeType)));
        }
        return ResponseEntity.ok(ApiResponse.success(permissionService.getAllPermissions()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PermissionResponse>> getPermissionById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(permissionService.getPermissionById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PermissionResponse>> updatePermission(
            @PathVariable String id,
            @Valid @RequestBody PermissionRequest request) {
        PermissionResponse updated = permissionService.updatePermission(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Permission updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePermission(@PathVariable String id) {
        permissionService.deletePermission(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Permission deleted successfully"));
    }
}