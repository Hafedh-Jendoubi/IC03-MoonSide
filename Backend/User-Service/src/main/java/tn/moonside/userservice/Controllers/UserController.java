package tn.moonside.userservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.moonside.userservice.dtos.requests.AssignRoleRequest;
import tn.moonside.userservice.dtos.requests.InviteUserRequest;
import tn.moonside.userservice.dtos.requests.UpdateAvatarRequest;
import tn.moonside.userservice.dtos.requests.UpdateUserRequest;
import tn.moonside.userservice.dtos.responses.ApiResponse;
import tn.moonside.userservice.dtos.responses.BulkInviteResult;
import tn.moonside.userservice.dtos.responses.UserResponse;
import tn.moonside.userservice.security.AppPermission;
import tn.moonside.userservice.security.RequiresPermission;
import tn.moonside.userservice.services.UserService;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** List all users — requires USER_READ_ALL permission */
    @GetMapping
    @RequiresPermission(AppPermission.USER_READ_ALL)
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    /** Read any user by ID — requires USER_READ permission */
    @GetMapping("/{id}")
    @RequiresPermission(AppPermission.USER_READ)
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    /** Read own profile — requires USER_READ_OWN permission */
    @GetMapping("/me")
    @RequiresPermission(AppPermission.USER_READ_OWN)
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserByEmail(userDetails.getUsername())));
    }

    /** Update own avatar — requires USER_UPDATE_OWN_AVATAR permission */
    @PatchMapping("/me/avatar")
    @RequiresPermission(AppPermission.USER_UPDATE_OWN_AVATAR)
    public ResponseEntity<ApiResponse<UserResponse>> updateMyAvatar(
            @RequestBody UpdateAvatarRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse updated = userService.updateAvatar(userDetails.getUsername(), request.getAvatarUrl());
        return ResponseEntity.ok(ApiResponse.success(updated, "Avatar updated successfully"));
    }

    /** Delete own avatar — requires USER_DELETE_OWN_AVATAR permission */
    @DeleteMapping("/me/avatar")
    @RequiresPermission(AppPermission.USER_DELETE_OWN_AVATAR)
    public ResponseEntity<ApiResponse<UserResponse>> deleteMyAvatar(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse updated = userService.updateAvatar(userDetails.getUsername(), null);
        return ResponseEntity.ok(ApiResponse.success(updated, "Avatar removed successfully"));
    }

    /** Get a user's roles — requires USER_READ_ROLES permission */
    @GetMapping("/{id}/roles")
    @RequiresPermission(AppPermission.USER_READ_ROLES)
    public ResponseEntity<ApiResponse<List<String>>> getUserRoles(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserRoleNames(id)));
    }

    /** Update any user — requires USER_UPDATE permission */
    @PutMapping("/{id}")
    @RequiresPermission(AppPermission.USER_UPDATE)
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable String id,
            @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse updated = userService.updateUser(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(updated, "User updated successfully"));
    }

    /** Delete a user — requires USER_DELETE permission */
    @DeleteMapping("/{id}")
    @RequiresPermission(AppPermission.USER_DELETE)
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    /** Assign a role to a user — requires USER_ASSIGN_ROLE permission */
    @PostMapping("/{userId}/roles")
    @RequiresPermission(AppPermission.USER_ASSIGN_ROLE)
    public ResponseEntity<ApiResponse<Void>> assignRole(
            @PathVariable String userId,
            @Valid @RequestBody AssignRoleRequest request) {
        userService.assignRole(userId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Role assigned successfully"));
    }

    /** Revoke a role from a user — requires USER_REVOKE_ROLE permission */
    @DeleteMapping("/{userId}/roles/{roleId}")
    @RequiresPermission(AppPermission.USER_REVOKE_ROLE)
    public ResponseEntity<ApiResponse<Void>> revokeRole(
            @PathVariable String userId,
            @PathVariable String roleId) {
        userService.revokeRole(userId, roleId);
        return ResponseEntity.ok(ApiResponse.success(null, "Role revoked successfully"));
    }

    /** Deactivate a user — requires USER_DEACTIVATE permission */
    @PatchMapping("/{id}/deactivate")
    @RequiresPermission(AppPermission.USER_DEACTIVATE)
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable String id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deactivated successfully"));
    }

    /** Activate a user — requires USER_ACTIVATE permission */
    @PatchMapping("/{id}/activate")
    @RequiresPermission(AppPermission.USER_ACTIVATE)
    public ResponseEntity<ApiResponse<Void>> activateUser(@PathVariable String id) {
        userService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User activated successfully"));
    }

    /** Invite a single user — requires USER_INVITE permission */
    @PostMapping("/invite")
    @RequiresPermission(AppPermission.USER_INVITE)
    public ResponseEntity<ApiResponse<UserResponse>> inviteUser(
            @Valid @RequestBody InviteUserRequest request) {
        UserResponse created = userService.inviteUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Invitation sent successfully. The user has been created and notified by email."));
    }

    /** Bulk invite users from Excel — requires USER_INVITE_BULK permission */
    @PostMapping("/invite/bulk")
    @RequiresPermission(AppPermission.USER_INVITE_BULK)
    public ResponseEntity<ApiResponse<BulkInviteResult>> bulkInviteUsers(
            @RequestParam("file") MultipartFile file) {
        BulkInviteResult result = userService.bulkInviteFromExcel(file);
        return ResponseEntity.ok(ApiResponse.success(result,
                "Bulk invite completed: " + result.getSucceeded() + " invited, " +
                result.getSkipped() + " skipped, " + result.getFailed() + " failed."));
    }
}
