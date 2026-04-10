package tn.moonside.userservice.Controllers;

import tn.moonside.userservice.dtos.requests.AssignRoleRequest;
import tn.moonside.userservice.dtos.requests.UpdateAvatarRequest;
import tn.moonside.userservice.dtos.requests.UpdateUserRequest;
import tn.moonside.userservice.dtos.responses.ApiResponse;
import tn.moonside.userservice.dtos.responses.UserResponse;
import tn.moonside.userservice.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserByEmail(userDetails.getUsername())));
    }

    @PatchMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyAvatar(
            @RequestBody UpdateAvatarRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse updated = userService.updateAvatar(userDetails.getUsername(), request.getAvatarUrl());
        return ResponseEntity.ok(ApiResponse.success(updated, "Avatar updated successfully"));
    }

    @DeleteMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> deleteMyAvatar(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse updated = userService.updateAvatar(userDetails.getUsername(), null);
        return ResponseEntity.ok(ApiResponse.success(updated, "Avatar removed successfully"));
    }

    /** Returns the list of role names for the given user — used by the frontend. */
    @GetMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<List<String>>> getUserRoles(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserRoleNames(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable String id,
            @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse updated = userService.updateUser(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(updated, "User updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    @PostMapping("/{userId}/roles")
    public ResponseEntity<ApiResponse<Void>> assignRole(
            @PathVariable String userId,
            @Valid @RequestBody AssignRoleRequest request) {
        userService.assignRole(userId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Role assigned successfully"));
    }

    @DeleteMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<ApiResponse<Void>> revokeRole(
            @PathVariable String userId,
            @PathVariable String roleId) {
        userService.revokeRole(userId, roleId);
        return ResponseEntity.ok(ApiResponse.success(null, "Role revoked successfully"));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable String id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deactivated successfully"));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activateUser(@PathVariable String id) {
        userService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User activated successfully"));
    }
}
