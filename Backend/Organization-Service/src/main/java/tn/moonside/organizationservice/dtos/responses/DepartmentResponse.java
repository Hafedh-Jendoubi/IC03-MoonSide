package tn.moonside.organizationservice.dtos.responses;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String avatarUrl;
    private String bannerUrl;
    @JsonProperty("isActive")
    private boolean isActive;
    private boolean membersPublic;
    private long teamCount;
    /** True if the requesting user is following this department. */
    @JsonProperty("isFollowing")
    private boolean isFollowing;
    /** Total number of followers. */
    private long followerCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
