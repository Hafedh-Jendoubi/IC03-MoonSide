package tn.moonside.userservice.Controllers;

import tn.moonside.userservice.Dtos.*;
import tn.moonside.userservice.Services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserCreateDTO userCreateDTO) {
        log.info("REST request to create user");
        UserDTO result = userService.createUser(userCreateDTO);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable UUID userId) {
        log.info("REST request to get user by id: {}", userId);
        UserDTO result = userService.getUserById(userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserDTO> getUserByEmail(@PathVariable String email) {
        log.info("REST request to get user by email: {}", email);
        UserDTO result = userService.getUserByEmail(email);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        log.info("REST request to get all users");
        List<UserDTO> results = userService.getAllUsers();
        return ResponseEntity.ok(results);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody UserUpdateDTO userUpdateDTO) {
        log.info("REST request to update user: {}", userId);
        UserDTO result = userService.updateUser(userId, userUpdateDTO);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID userId) {
        log.info("REST request to delete user: {}", userId);
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<UserDTO> assignRoleToUser(
            @PathVariable UUID userId,
            @PathVariable UUID roleId) {
        log.info("REST request to assign role {} to user {}", roleId, userId);
        UserDTO result = userService.assignRoleToUser(userId, roleId);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<UserDTO> removeRoleFromUser(
            @PathVariable UUID userId,
            @PathVariable UUID roleId) {
        log.info("REST request to remove role {} from user {}", roleId, userId);
        UserDTO result = userService.removeRoleFromUser(userId, roleId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO loginRequest) {
        log.info("REST request to login");
        LoginResponseDTO result = userService.login(loginRequest);
        return ResponseEntity.ok(result);
    }
}