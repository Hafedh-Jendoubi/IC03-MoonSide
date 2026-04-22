package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.requests.AssignRoleRequest;
import tn.moonside.userservice.dtos.requests.UpdateUserRequest;
import tn.moonside.userservice.dtos.responses.UserResponse;
import tn.moonside.userservice.dtos.requests.InviteUserRequest;

import org.springframework.web.multipart.MultipartFile;
import tn.moonside.userservice.dtos.responses.BulkInviteResult;
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
    /** Revoke a role from a user by role name (e.g. "TEAM_LEADER"). No-op if not assigned. */
    void revokeRoleByName(String userId, String roleName);
    void deactivateUser(String id);
    void activateUser(String id);
    /** Returns the role names (e.g. ["ADMIN", "EMPLOYEE"]) for a given user. */
    List<String> getUserRoleNames(String userId);
    UserResponse inviteUser(InviteUserRequest request);
    BulkInviteResult bulkInviteFromExcel(MultipartFile file);
}
