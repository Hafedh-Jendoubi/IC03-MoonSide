package tn.moonside.badgeservice.events;

import lombok.*;

/** Mirror of tn.moonside.userservice.event.UserActivityEvent — kept separate to avoid shared-library coupling. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserActivityEvent {
    private String userId;
    private String activityType;
    private Integer value;
}
