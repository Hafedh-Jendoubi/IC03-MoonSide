package tn.moonside.organizationservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
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

    /**
     * Optional — a team does NOT need to belong to a department.
     * Leave null or omit to create an independent team.
     */
    private String departmentId;

    private String leadId;
    private String avatarUrl;
    private String bannerUrl;

    private VisibilityType teamVisibility = VisibilityType.PUBLIC;
}
