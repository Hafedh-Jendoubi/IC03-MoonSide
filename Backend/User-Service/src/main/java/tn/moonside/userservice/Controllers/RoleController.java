package tn.moonside.userservice.Controllers;

import tn.moonside.userservice.Dtos.RoleCreateDTO;
import tn.moonside.userservice.Dtos.RoleDTO;
import tn.moonside.userservice.Services.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Slf4j
public class RoleController {

    private final RoleService roleService;

    @PostMapping
    public ResponseEntity<RoleDTO> createRole(@Valid @RequestBody RoleCreateDTO roleCreateDTO) {
        log.info("REST request to create role");
        RoleDTO result = roleService.createRole(roleCreateDTO);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @GetMapping("/{roleId}")
    public ResponseEntity<RoleDTO> getRoleById(@PathVariable UUID roleId) {
        log.info("REST request to get role by id: {}", roleId);
        RoleDTO result = roleService.getRoleById(roleId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<RoleDTO> getRoleByName(@PathVariable String name) {
        log.info("REST request to get role by name: {}", name);
        RoleDTO result = roleService.getRoleByName(name);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        log.info("REST request to get all roles");
        List<RoleDTO> results = roleService.getAllRoles();
        return ResponseEntity.ok(results);
    }

    @PutMapping("/{roleId}")
    public ResponseEntity<RoleDTO> updateRole(
            @PathVariable UUID roleId,
            @Valid @RequestBody RoleCreateDTO roleUpdateDTO) {
        log.info("REST request to update role: {}", roleId);
        RoleDTO result = roleService.updateRole(roleId, roleUpdateDTO);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{roleId}")
    public ResponseEntity<Void> deleteRole(@PathVariable UUID roleId) {
        log.info("REST request to delete role: {}", roleId);
        roleService.deleteRole(roleId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{roleId}/permissions/{permissionId}")
    public ResponseEntity<RoleDTO> assignPermissionToRole(
            @PathVariable UUID roleId,
            @PathVariable UUID permissionId) {
        log.info("REST request to assign permission {} to role {}", permissionId, roleId);
        RoleDTO result = roleService.assignPermissionToRole(roleId, permissionId);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{roleId}/permissions/{permissionId}")
    public ResponseEntity<RoleDTO> removePermissionFromRole(
            @PathVariable UUID roleId,
            @PathVariable UUID permissionId) {
        log.info("REST request to remove permission {} from role {}", permissionId, roleId);
        RoleDTO result = roleService.removePermissionFromRole(roleId, permissionId);
        return ResponseEntity.ok(result);
    }
}