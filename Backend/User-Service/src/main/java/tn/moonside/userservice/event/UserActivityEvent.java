package tn.moonside.userservice.event;

import lombok.*;

/**
 * Kafka event published whenever a user performs an action that may unlock a
 * badge (connection accepted, daily login streak, profile completed, email
 * verified, ...). Consumed exclusively by Badge-Service, which owns all
 * badge-awarding logic — this event is intentionally lightweight and generic
 * so new badge types never require changes to the producers.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserActivityEvent {

    private String userId;

    /**
     * One of: CONNECTION_ACCEPTED, LOGIN_STREAK, EMAIL_VERIFIED, PROFILE_COMPLETED.
     * Kept as a plain string (mirrored, not shared) so Badge-Service can evolve
     * independently of User-Service, the same convention used for NotificationEvent.
     */
    private String activityType;

    /**
     * Optional numeric payload. For LOGIN_STREAK this is the user's current
     * consecutive-day streak; ignored for simple one-off activity types.
     */
    private Integer value;
}
