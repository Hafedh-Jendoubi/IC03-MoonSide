package tn.moonside.userservice.Dtos;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleCreateDTO {
    @NotBlank(message = "Role name is required")
    private String name;

    private String description;
    private Set<UUID> permissionIds;
}