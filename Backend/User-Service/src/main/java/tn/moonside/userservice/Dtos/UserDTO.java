package tn.moonside.userservice.Dtos;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private UUID userId;

    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "First name is required")
    private String firstname;

    @NotBlank(message = "Last name is required")
    private String lastname;

    private LocalDateTime birthDate;
    private String phoneNumber;
    private String jobTitle;
    private String bio;
    private String avatar;
    private boolean isActive;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private Set<RoleDTO> roles;
}