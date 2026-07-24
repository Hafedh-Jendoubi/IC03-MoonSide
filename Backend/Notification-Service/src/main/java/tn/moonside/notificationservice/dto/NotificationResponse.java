package tn.moonside.notificationservice.dto;

import lombok.*;
import tn.moonside.notificationservice.enums.NotificationType;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private String id;
    private String recipientId;
    private String senderId;
    private NotificationType notificationType;
    private String title;
    private String body;
    private String resourceId;
    private String resourceType;
    private boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
