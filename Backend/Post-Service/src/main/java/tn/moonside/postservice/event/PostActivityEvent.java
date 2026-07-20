package tn.moonside.postservice.event;

import lombok.*;

/**
 * Kafka event published by Post-Service when a post is created.
 * Consumed by Badge-Service to track post-count milestones.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostActivityEvent {
    private String authorId;
    /** Always "POST_CREATED" for now; extensible for future post-type milestones. */
    private String activityType;
    /** Total post count for this user at the time of this event. */
    private Long totalPosts;
}
