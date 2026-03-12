package tn.moonside.userservice.dtos.requests;

import tn.moonside.userservice.entities.TypeScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PermissionRequest {

    @NotBlank(message = "Action is required")
    private String action;

    @NotNull(message = "Scope type is required")
    private TypeScope scopeType;

    private String description;
}
