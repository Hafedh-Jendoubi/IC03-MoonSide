package tn.moonside.userservice.Services;

import tn.moonside.userservice.Dtos.*;
import tn.moonside.userservice.Exceptions.ResourceNotFoundException;
import tn.moonside.userservice.Exceptions.DuplicateResourceException;
import tn.moonside.userservice.Entities.User;
import tn.moonside.userservice.Entities.Role;
import tn.moonside.userservice.Entities.Permission;
import tn.moonside.userservice.Repositories.UserRepository;
import tn.moonside.userservice.Repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService implements IUserService{
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Transactional
    public UserDTO createUser(UserCreateDTO userCreateDTO) {
        log.info("Creating new user with email: {}", userCreateDTO.getEmail());

        // Check if user already exists
        if (userRepository.existsByEmail(userCreateDTO.getEmail())) {
            throw new DuplicateResourceException("User with email " + userCreateDTO.getEmail() + " already exists");
        }

        // Create new user
        User user = User.builder()
                .userId(UUID.randomUUID())
                .email(userCreateDTO.getEmail())
                .password(userCreateDTO.getPassword()) // In real app, encrypt this!
                .firstname(userCreateDTO.getFirstname())
                .lastname(userCreateDTO.getLastname())
                .birthDate(userCreateDTO.getBirthDate())
                .phoneNumber(userCreateDTO.getPhoneNumber())
                .jobTitle(userCreateDTO.getJobTitle())
                .bio(userCreateDTO.getBio())
                .avatar(userCreateDTO.getAvatar())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .roles(new HashSet<>())
                .build();

        // Assign roles if provided
        if (userCreateDTO.getRoleIds() != null && !userCreateDTO.getRoleIds().isEmpty()) {
            Set<Role> roles = userCreateDTO.getRoleIds().stream()
                    .map(roleId -> roleRepository.findByRoleId(roleId)
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        User savedUser = userRepository.save(user);
        log.info("User created successfully with id: {}", savedUser.getUserId());

        return mapToDTO(savedUser);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(UUID userId) {
        log.info("Fetching user with id: {}", userId);

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return mapToDTO(user);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserByEmail(String email) {
        log.info("Fetching user with email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        return mapToDTO(user);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        log.info("Fetching all users");

        return userRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO updateUser(UUID userId, UserUpdateDTO userUpdateDTO) {
        log.info("Updating user with id: {}", userId);

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Update fields if provided
        if (userUpdateDTO.getEmail() != null) {
            // Check if new email is already taken by another user
            userRepository.findByEmail(userUpdateDTO.getEmail())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getUserId().equals(userId)) {
                            throw new DuplicateResourceException("Email " + userUpdateDTO.getEmail() + " is already taken");
                        }
                    });
            user.setEmail(userUpdateDTO.getEmail());
        }

        if (userUpdateDTO.getFirstname() != null) {
            user.setFirstname(userUpdateDTO.getFirstname());
        }

        if (userUpdateDTO.getLastname() != null) {
            user.setLastname(userUpdateDTO.getLastname());
        }

        if (userUpdateDTO.getBirthDate() != null) {
            user.setBirthDate(userUpdateDTO.getBirthDate());
        }

        if (userUpdateDTO.getPhoneNumber() != null) {
            user.setPhoneNumber(userUpdateDTO.getPhoneNumber());
        }

        if (userUpdateDTO.getJobTitle() != null) {
            user.setJobTitle(userUpdateDTO.getJobTitle());
        }

        if (userUpdateDTO.getBio() != null) {
            user.setBio(userUpdateDTO.getBio());
        }

        if (userUpdateDTO.getAvatar() != null) {
            user.setAvatar(userUpdateDTO.getAvatar());
        }

        // Update roles if provided
        if (userUpdateDTO.getRoleIds() != null) {
            Set<Role> roles = userUpdateDTO.getRoleIds().stream()
                    .map(roleId -> roleRepository.findByRoleId(roleId)
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        User updatedUser = userRepository.save(user);
        log.info("User updated successfully with id: {}", updatedUser.getUserId());

        return mapToDTO(updatedUser);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        log.info("Deleting user with id: {}", userId);

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Soft delete - deactivate user
        user.setActive(false);
        userRepository.save(user);

        log.info("User deactivated successfully with id: {}", userId);
    }

    @Transactional
    public UserDTO assignRoleToUser(UUID userId, UUID roleId) {
        log.info("Assigning role {} to user {}", roleId, userId);

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Role role = roleRepository.findByRoleId(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));

        user.getRoles().add(role);
        User updatedUser = userRepository.save(user);

        log.info("Role assigned successfully");
        return mapToDTO(updatedUser);
    }

    @Transactional
    public UserDTO removeRoleFromUser(UUID userId, UUID roleId) {
        log.info("Removing role {} from user {}", roleId, userId);

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.getRoles().removeIf(role -> role.getRoleId().equals(roleId));
        User updatedUser = userRepository.save(user);

        log.info("Role removed successfully");
        return mapToDTO(updatedUser);
    }

    @Transactional(readOnly = true)
    public LoginResponseDTO login(LoginRequestDTO loginRequest) {
        log.info("Login attempt for email: {}", loginRequest.getEmail());

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid credentials"));

        // In real app, use password encoder to check password
        if (!user.getPassword().equals(loginRequest.getPassword())) {
            throw new ResourceNotFoundException("Invalid credentials");
        }

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        log.info("User logged in successfully: {}", user.getUserId());

        return LoginResponseDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .roles(user.getRoles().stream().map(this::mapRoleToDTO).collect(Collectors.toSet()))
                .token("jwt-token-placeholder") // Will implement JWT later
                .build();
    }

    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .birthDate(user.getBirthDate())
                .phoneNumber(user.getPhoneNumber())
                .jobTitle(user.getJobTitle())
                .bio(user.getBio())
                .avatar(user.getAvatar())
                .isActive(user.isActive())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .roles(user.getRoles().stream().map(this::mapRoleToDTO).collect(Collectors.toSet()))
                .build();
    }

    private RoleDTO mapRoleToDTO(Role role) {
        return RoleDTO.builder()
                .roleId(role.getRoleId())
                .name(role.getName())
                .description(role.getDescription())
                .createdAt(role.getCreatedAt())
                .permissions(role.getPermissions().stream().map(this::mapPermissionToDTO).collect(Collectors.toSet()))
                .build();
    }

    private PermissionDTO mapPermissionToDTO(Permission permission) {
        return PermissionDTO.builder()
                .permissionId(permission.getPermissionId())
                .action(permission.getAction())
                .scopeType(permission.getScopeType())
                .description(permission.getDescription())
                .createdAt(permission.getCreatedAt())
                .build();
    }
}