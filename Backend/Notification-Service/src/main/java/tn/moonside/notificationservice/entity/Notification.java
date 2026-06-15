package tn.moonside.notificationservice.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.moonside.notificationservice.enums.NotificationType;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    private String id;

    /** The user who receives the notification. */
    @Indexed
    private String recipientId;

    /** The user who triggered the action (nullable for system notifications). */
    private String senderId;

    private NotificationType notificationType;

    private String title;

    private String body;

    /**
     * Optional reference to the resource that triggered this notification
     * (e.g. post ID, comment ID). Lets the frontend deep-link to the item.
     */
    private String resourceId;

    /** "POST" | "COMMENT" — helps the frontend route to the right page. */
    private String resourceType;

    @Builder.Default
    private boolean isRead = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime readAt;
}
