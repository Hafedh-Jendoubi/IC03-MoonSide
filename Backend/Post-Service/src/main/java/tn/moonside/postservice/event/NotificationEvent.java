package tn.moonside.postservice.event;

import lombok.*;

/**
 * Kafka event payload published by Post-Service when a notification-triggering
 * action occurs (comment, reaction, pin).
 *
 * This mirrors tn.moonside.notificationservice.event.NotificationEvent —
 * kept as a separate class to avoid a shared-library dependency.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEvent {

    private String recipientId;
    private String senderId;
    /** Matches NotificationType enum in notification-service. */
    private String notificationType;
    private String title;
    private String body;
    /** ID of the post / comment that triggered this event. */
    private String resourceId;
    /** "POST" or "COMMENT" */
    private String resourceType;
}
