package tn.moonside.organizationservice.dtos.responses;

import lombok.Builder;
import lombok.Data;
import tn.moonside.organizationservice.enums.VisibilityType;

import java.time.LocalDateTime;

@Data
@Builder
public class TeamResponse {
    private String id;
    private String departmentId;
    private String departmentName;
    private String leadId;
    /** Lightweight lead info fetched from user-service (may be null). */
    private UserSummary lead;
    private String name;
    private String description;
    private String image;
    private VisibilityType teamVisibility;
    private long memberCount;
    /** True if the requesting user is already a member. */
    private boolean isMember;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
