package tn.moonside.organizationservice.dtos.responses;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {
    private String id;
    private String userId;
    private String entityId;
    private String entityType;
    private String action;
    private String description;
    private boolean success;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private LocalDateTime createdAt;
}
