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
    /** Names of all roles assigned to this user via the UserRole table. */
    private List<String> roles;
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
