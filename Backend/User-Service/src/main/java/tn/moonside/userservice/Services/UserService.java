package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.requests.AssignRoleRequest;
import tn.moonside.userservice.dtos.requests.UpdateUserRequest;
import tn.moonside.userservice.dtos.responses.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse getUserById(String id);
    UserResponse getUserByEmail(String email);
    List<UserResponse> getAllUsers();
    UserResponse updateUser(String id, UpdateUserRequest request, String currentUserEmail);
    UserResponse updateAvatar(String email, String avatarUrl);
    void deleteUser(String id);
    void assignRole(String userId, AssignRoleRequest request);
    void revokeRole(String userId, String roleId);
    void deactivateUser(String id);
    void activateUser(String id);
    /** Returns the role names (e.g. ["ADMIN", "EMPLOYEE"]) for a given user. */
    List<String> getUserRoleNames(String userId);
}
