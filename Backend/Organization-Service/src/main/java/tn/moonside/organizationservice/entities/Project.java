package tn.moonside.organizationservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.moonside.organizationservice.enums.ProjectStatus;
import tn.moonside.organizationservice.enums.VisibilityType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * A software project managed by one or more Teams.
 * A project is NOT required to belong to a department — it belongs to team(s).
 */
@Document(collection = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    private String id;

    /** Display name of the project. */
    private String name;

    /** Short description / elevator pitch. */
    private String description;

    /** Team IDs responsible for this project (at least one required). */
    @Builder.Default
    private List<String> teamIds = List.of();

    // ── Software-engineering metadata ─────────────────────────────────────────

    /** Main tech stack (e.g. ["Java", "Spring Boot", "React", "MongoDB"]). */
    @Builder.Default
    private List<String> technologies = List.of();

    /** Repository URL (GitHub / GitLab / Bitbucket …). */
    private String repositoryUrl;

    /** Live / staging URL. */
    private String projectUrl;

    /** Current lifecycle status. */
    @Builder.Default
    private ProjectStatus status = ProjectStatus.PLANNING;

    /** Optional start date. */
    private LocalDate startDate;

    /** Optional target end date. */
    private LocalDate endDate;

    /** Optional avatar / logo URL. */
    private String avatarUrl;

    /** Optional banner URL. */
    private String bannerUrl;

    @Builder.Default
    private VisibilityType visibility = VisibilityType.PUBLIC;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
