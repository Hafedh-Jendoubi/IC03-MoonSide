package tn.moonside.badgeservice.events;

import lombok.*;

/** Mirror of tn.moonside.postservice.event.PostActivityEvent. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostActivityEvent {
    private String authorId;
    private String activityType;
    private Long totalPosts;
}
