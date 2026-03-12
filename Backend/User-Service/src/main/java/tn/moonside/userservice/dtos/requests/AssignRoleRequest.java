package tn.moonside.userservice.dtos.requests;

import tn.moonside.userservice.entities.TypeScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignRoleRequest {

    @NotBlank(message = "Role ID is required")
    private String roleId;

    @NotNull(message = "Scope type is required")
    private TypeScope scopeType;

    private String scopeId;
}