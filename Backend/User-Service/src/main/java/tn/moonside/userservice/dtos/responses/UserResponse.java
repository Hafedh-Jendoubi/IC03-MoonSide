package tn.moonside.userservice.dtos.responses;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserResponse {

    private String id;
    /** Names of all roles assigned to this user via the UserRole table (e.g. ["EMPLOYEE", "TEAM_LEADER"]). */
    private List<String> roles;
    /**
     * Flat list of every permission action string the user holds across all roles.
     * Includes "ANYTHING" for CEO. Used by the frontend for fine-grained UI decisions.
     */
    private List<String> permissions;
    private String email;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private String phoneNumber;
    private String jobTitle;
    private String bio;
    private String avatar;
    private boolean isActive;
    private boolean mustChangePassword;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
