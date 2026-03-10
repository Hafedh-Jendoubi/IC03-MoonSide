package tn.moonside.userservice.Controllers;

import tn.moonside.userservice.Dtos.PermissionCreateDTO;
import tn.moonside.userservice.Dtos.PermissionDTO;
import tn.moonside.userservice.Services.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
@Slf4j
public class PermissionController {

    private final PermissionService permissionService;

    @PostMapping
    public ResponseEntity<PermissionDTO> createPermission(
            @Valid @RequestBody PermissionCreateDTO permissionCreateDTO) {
        log.info("REST request to create permission");
        PermissionDTO result = permissionService.createPermission(permissionCreateDTO);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @GetMapping("/{permissionId}")
    public ResponseEntity<PermissionDTO> getPermissionById(@PathVariable UUID permissionId) {
        log.info("REST request to get permission by id: {}", permissionId);
        PermissionDTO result = permissionService.getPermissionById(permissionId);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<PermissionDTO>> getAllPermissions() {
        log.info("REST request to get all permissions");
        List<PermissionDTO> results = permissionService.getAllPermissions();
        return ResponseEntity.ok(results);
    }

    @PutMapping("/{permissionId}")
    public ResponseEntity<PermissionDTO> updatePermission(
            @PathVariable UUID permissionId,
            @Valid @RequestBody PermissionCreateDTO permissionUpdateDTO) {
        log.info("REST request to update permission: {}", permissionId);
        PermissionDTO result = permissionService.updatePermission(permissionId, permissionUpdateDTO);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{permissionId}")
    public ResponseEntity<Void> deletePermission(@PathVariable UUID permissionId) {
        log.info("REST request to delete permission: {}", permissionId);
        permissionService.deletePermission(permissionId);
        return ResponseEntity.noContent().build();
    }
}