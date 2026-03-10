package tn.moonside.user.Dtos;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleDTO {
    private UUID roleId;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private Set<PermissionDTO> permissions;
}