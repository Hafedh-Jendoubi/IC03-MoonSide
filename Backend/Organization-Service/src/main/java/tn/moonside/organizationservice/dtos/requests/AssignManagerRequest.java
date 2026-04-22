package tn.moonside.organizationservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssignManagerRequest {

    @NotBlank(message = "Manager user ID is required")
    private String managerId;
}
