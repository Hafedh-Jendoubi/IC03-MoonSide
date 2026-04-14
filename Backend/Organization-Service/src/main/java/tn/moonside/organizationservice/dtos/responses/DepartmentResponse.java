package tn.moonside.organizationservice.dtos.responses;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DepartmentResponse {
    private String id;
    private String managerId;
    /** Lightweight manager info fetched from user-service (may be null). */
    private UserSummary manager;
    private String name;
    private String description;
    private boolean isActive;
    private long teamCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
