package tn.moonside.organizationservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.moonside.organizationservice.enums.VisibilityType;

import java.time.LocalDateTime;

@Document(collection = "teams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    private String id;

    /** Foreign key to Department._id */
    private String departmentId;

    /** User ID of the team lead (must exist in user-service). */
    private String leadId;

    private String name;
    private String description;

    /** URL to a team banner / logo image stored in media-service. */
    private String image;

    @Builder.Default
    private VisibilityType teamVisibility = VisibilityType.PUBLIC;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
