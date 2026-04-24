package tn.moonside.organizationservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    private String id;

    /** The user who triggered the action */
    private String userId;

    /** The entity affected (department id, team id, etc.) */
    private String entityId;

    /** Type of entity: DEPARTMENT, TEAM, TEAM_MEMBER */
    private String entityType;

    /**
     * Action performed:
     * DEPARTMENT_CREATED, DEPARTMENT_UPDATED, DEPARTMENT_DELETED,
     * DEPARTMENT_ACTIVATED, DEPARTMENT_DEACTIVATED,
     * DEPARTMENT_MANAGER_ASSIGNED, DEPARTMENT_MANAGER_REMOVED,
     * TEAM_CREATED, TEAM_UPDATED, TEAM_DELETED,
     * TEAM_LEAD_ASSIGNED, TEAM_LEAD_REMOVED,
     * TEAM_MEMBER_ADDED, TEAM_MEMBER_REMOVED
     */
    private String action;

    /** Human-readable outcome description */
    private String description;

    /** Whether the action succeeded */
    private boolean success;

    /** Snapshot of relevant data before the change (JSON string) */
    private String oldValue;

    /** Snapshot of relevant data after the change (JSON string) */
    private String newValue;

    /** Client IP address */
    private String ipAddress;

    @Builder.Default
    @Indexed
    private LocalDateTime createdAt = LocalDateTime.now();
}
