package tn.moonside.organizationservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import tn.moonside.organizationservice.enums.VisibilityType;

@Data
public class TeamRequest {

    @NotBlank(message = "Team name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotBlank(message = "Department ID is required")
    private String departmentId;

    /** User ID of the team lead — optional at creation. */
    private String leadId;

    /** URL to the team image/logo — optional. */
    private String image;

    @NotNull(message = "Visibility is required")
    private VisibilityType teamVisibility = VisibilityType.PUBLIC;
}
