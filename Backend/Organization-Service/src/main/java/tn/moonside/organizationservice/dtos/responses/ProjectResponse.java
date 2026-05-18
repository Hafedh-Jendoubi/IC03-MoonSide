package tn.moonside.organizationservice.dtos.responses;

import lombok.Builder;
import lombok.Data;
import tn.moonside.organizationservice.enums.ProjectStatus;
import tn.moonside.organizationservice.enums.VisibilityType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProjectResponse {
    private String id;
    private String name;
    private String description;

    /** Lightweight team summaries for the teams responsible for this project. */
    private List<TeamSummary> teams;

    private List<String> technologies;
    private String repositoryUrl;
    private String projectUrl;
    private ProjectStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String avatarUrl;
    private String bannerUrl;
    private VisibilityType visibility;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Minimal team info embedded in project responses. */
    @Data
    @Builder
    public static class TeamSummary {
        private String id;
        private String name;
        private String avatarUrl;
    }
}
