package tn.moonside.organizationservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import tn.moonside.organizationservice.enums.ProjectStatus;
import tn.moonside.organizationservice.enums.VisibilityType;

import java.time.LocalDate;
import java.util.List;

@Data
public class ProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(min = 2, max = 120, message = "Name must be between 2 and 120 characters")
    private String name;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    /** At least one responsible team is required. */
    @NotEmpty(message = "At least one team ID is required")
    private List<String> teamIds;

    private List<String> technologies;

    private String repositoryUrl;
    private String projectUrl;

    private ProjectStatus status = ProjectStatus.PLANNING;

    private LocalDate startDate;
    private LocalDate endDate;

    private String avatarUrl;
    private String bannerUrl;

    private VisibilityType visibility = VisibilityType.PUBLIC;
}
