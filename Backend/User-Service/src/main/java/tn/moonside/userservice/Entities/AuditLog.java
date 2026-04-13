package tn.moonside.userservice.entities;

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

    /** The user who triggered the action (null for anonymous attempts) */
    private String userId;

    /** The entity affected (user id, role id, etc.) — may equal userId */
    private String entityId;

    /** Type of entity: USER, ROLE, PERMISSION, SESSION */
    private String entityType;

    /**
     * Action performed:
     * LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT,
     * REGISTER_SUCCESS, REGISTER_FAILURE,
     * EMAIL_VERIFY_SUCCESS, EMAIL_VERIFY_FAILURE,
     * PASSWORD_RESET_REQUEST, PASSWORD_RESET_SUCCESS,
     * TWO_FA_ENABLED, TWO_FA_DISABLED, TWO_FA_VERIFY_SUCCESS, TWO_FA_VERIFY_FAILURE,
     * PROFILE_UPDATE, AVATAR_UPDATE, AVATAR_DELETE,
     * ROLE_ASSIGNED, ROLE_REVOKED,
     * USER_DEACTIVATED, USER_ACTIVATED, USER_DELETED
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
