package tn.moonside.notificationservice.dto;

import lombok.*;

/**
 * Used both to return the authenticated user's current notification preferences
 * and to accept partial/full updates via PUT /api/notifications/preferences.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceDto {
    private boolean badgeEarnedNotifications;
    private boolean mentionNotifications;
    private boolean commentNotifications;
    private boolean reactionNotifications;
    private boolean followNotifications;
    private boolean connectionNotifications;
    private boolean announcementNotifications;
}
