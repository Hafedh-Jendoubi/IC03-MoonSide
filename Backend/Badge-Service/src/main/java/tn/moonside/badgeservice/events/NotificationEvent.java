package tn.moonside.badgeservice.events;

import lombok.*;

/** Outbound event published to notifications-events so Notification-Service sends a push. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEvent {
    private String recipientId;
    private String senderId;
    private String notificationType;
    private String title;
    private String body;
    private String resourceId;
    private String resourceType;
}
