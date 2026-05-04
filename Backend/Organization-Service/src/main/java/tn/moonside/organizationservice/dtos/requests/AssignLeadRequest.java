package tn.moonside.organizationservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssignLeadRequest {

    @NotBlank(message = "Lead user ID is required")
    private String leadId;
}
