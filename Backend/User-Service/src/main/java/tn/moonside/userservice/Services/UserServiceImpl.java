package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.requests.AssignRoleRequest;
import tn.moonside.userservice.dtos.requests.UpdateUserRequest;
import tn.moonside.userservice.dtos.responses.UserResponse;
import tn.moonside.userservice.exceptions.DuplicateResourceException;
import tn.moonside.userservice.exceptions.ResourceNotFoundException;
import tn.moonside.userservice.entities.Role;
import tn.moonside.userservice.entities.User;
import tn.moonside.userservice.entities.UserRole;
import tn.moonside.userservice.repositories.RoleRepository;
import tn.moonside.userservice.repositories.UserRepository;
import tn.moonside.userservice.repositories.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;

    @Override
    public UserResponse getUserById(String id) {
        User user = findUserById(id);
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return mapToUserResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse updateUser(String id, UpdateUserRequest request, String currentUserEmail) {
        User user = findUserById(id);

        if (request.getFirstName()   != null) user.setFirstName(request.getFirstName());
        if (request.getLastName()    != null) user.setLastName(request.getLastName());
        if (request.getBirthDate()   != null) user.setBirthDate(request.getBirthDate());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getJobTitle()    != null) user.setJobTitle(request.getJobTitle());
        if (request.getBio()         != null) user.setBio(request.getBio());
        if (request.getAvatar()      != null) user.setAvatar(request.getAvatar());

        user.setUpdatedBy(currentUserEmail);
        user.setUpdatedAt(LocalDateTime.now());

        User updated = userRepository.save(user);
        log.info("Updated user: {}", updated.getId());
        return mapToUserResponse(updated);
    }

    @Override
    @Transactional
    public void deleteUser(String id) {
        User user = findUserById(id);
        userRoleRepository.findByUserId(id).forEach(userRoleRepository::delete);
        userRepository.delete(user);
        log.info("Deleted user: {}", id);
    }

    @Override
    @Transactional
    public void assignRole(String userId, AssignRoleRequest request) {
        findUserById(userId);

        roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRoleId()));

        String scopeId = request.getScopeId() != null ? request.getScopeId() : "GLOBAL";

        boolean alreadyAssigned = userRoleRepository.existsByUserIdAndRoleIdAndScopeTypeAndScopeId(
                userId, request.getRoleId(), request.getScopeType(), scopeId);

        if (alreadyAssigned) {
            throw new DuplicateResourceException("Role already assigned to user with this scope");
        }

        UserRole userRole = UserRole.builder()
                .userId(userId)
                .roleId(request.getRoleId())
                .scopeType(request.getScopeType())
                .scopeId(scopeId)
                .build();

        userRoleRepository.save(userRole);
        log.info("Assigned role {} to user {}", request.getRoleId(), userId);
    }

    @Override
    @Transactional
    public void revokeRole(String userId, String roleId) {
        findUserById(userId);
        userRoleRepository.deleteByUserIdAndRoleId(userId, roleId);
        log.info("Revoked role {} from user {}", roleId, userId);
    }

    @Override
    @Transactional
    public void deactivateUser(String id) {
        User user = findUserById(id);
        user.setActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("Deactivated user: {}", id);
    }

    @Override
    @Transactional
    public void activateUser(String id) {
        User user = findUserById(id);
        user.setActive(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("Activated user: {}", id);
    }

    @Override
    public List<String> getUserRoleNames(String userId) {
        return userRoleRepository.findByUserId(userId).stream()
                .map(userRole -> roleRepository.findById(userRole.getRoleId())
                        .map(Role::getName)
                        .orElse(null))
                .filter(name -> name != null)
                .distinct()
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private UserResponse mapToUserResponse(User user) {
        List<String> roles = getUserRoleNames(user.getId());
        return UserResponse.builder()
                .id(user.getId())
                .roles(roles)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .birthDate(user.getBirthDate())
                .phoneNumber(user.getPhoneNumber())
                .jobTitle(user.getJobTitle())
                .bio(user.getBio())
                .avatar(user.getAvatar())
                .isActive(user.isActive())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
