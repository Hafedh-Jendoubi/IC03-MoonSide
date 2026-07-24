package tn.moonside.notificationservice.event;

import lombok.*;
import tn.moonside.notificationservice.enums.NotificationType;

/**
 * The event payload published to Kafka by any microservice (e.g. Post-Service)
 * and consumed by the Notification-Service.
 *
 * Keep this class as a plain POJO so it can be duplicated in producer services
 * without a shared library dependency.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEvent {

    private String recipientId;
    private String senderId;
    private NotificationType notificationType;
    private String title;
    private String body;
    /** ID of the post / comment that triggered this event. */
    private String resourceId;
    /** "POST" or "COMMENT" */
    private String resourceType;
}
