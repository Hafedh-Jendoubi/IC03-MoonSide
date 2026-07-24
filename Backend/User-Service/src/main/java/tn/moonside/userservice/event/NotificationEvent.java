package tn.moonside.userservice.event;

import lombok.*;

/**
 * Kafka event payload published by User-Service when a notification-triggering
 * action occurs (connection request, connection accepted).
 *
 * Mirrors tn.moonside.notificationservice.event.NotificationEvent — kept as a
 * separate class to avoid a shared-library dependency between services.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEvent {

    private String recipientId;
    private String senderId;
    /** Matches NotificationType enum in notification-service (e.g. CONNECTION_REQUEST). */
    private String notificationType;
    private String title;
    private String body;
    /** ID of the resource that triggered this event (here: the connection ID). */
    private String resourceId;
    /** "CONNECTION" */
    private String resourceType;
}
