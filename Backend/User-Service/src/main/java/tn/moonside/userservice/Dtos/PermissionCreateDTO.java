package tn.moonside.userservice.Dtos;

import tn.moonside.userservice.Enums.TypeScope;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionCreateDTO {
    @NotBlank(message = "Action is required")
    private String action;

    private TypeScope scopeType;
    private String description;
}