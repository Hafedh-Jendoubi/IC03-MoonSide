package tn.moonside.userservice.Dtos;

import tn.moonside.userservice.Enums.TypeScope;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionDTO {
    private UUID permissionId;
    private String action;
    private TypeScope scopeType;
    private String description;
    private LocalDateTime createdAt;
}