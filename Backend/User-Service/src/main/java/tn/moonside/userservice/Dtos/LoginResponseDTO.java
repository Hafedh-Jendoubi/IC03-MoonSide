package tn.moonside.user.Dtos;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {
    private UUID userId;
    private String email;
    private String firstname;
    private String lastname;
    private String token; // Will be used when we add JWT
    private Set<RoleDTO> roles;
}