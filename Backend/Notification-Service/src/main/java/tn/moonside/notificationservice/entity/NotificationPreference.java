package tn.moonside.notificationservice.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Per-user notification preferences.
 * One document per user; controls which categories of {@link tn.moonside.notificationservice.enums.NotificationType}
 * are allowed to be created/delivered for that user.
 *
 * Every flag defaults to {@code true} so existing users keep receiving everything
 * until they explicitly opt out.
 */
@Document(collection = "notification_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    private String id;

    /** Owning user. One preference document per user. */
    @Indexed(unique = true)
    private String userId;

    /** Someone earned/awarded a badge (NotificationType.BADGE_EARNED). */
    @Builder.Default
    private boolean badgeEarnedNotifications = true;

    /** You were tagged/mentioned in a post or comment (NotificationType.MENTION). */
    @Builder.Default
    private boolean mentionNotifications = true;

    /** Someone commented on your post (NotificationType.COMMENT). */
    @Builder.Default
    private boolean commentNotifications = true;

    /** Someone reacted to your post (NotificationType.REACTION). */
    @Builder.Default
    private boolean reactionNotifications = true;

    /** Someone started following you (NotificationType.FOLLOW). */
    @Builder.Default
    private boolean followNotifications = true;

    /** Connection request sent/accepted (NotificationType.CONNECTION_REQUEST / CONNECTION_ACCEPTED). */
    @Builder.Default
    private boolean connectionNotifications = true;

    /** Org-wide announcements and pinned posts (NotificationType.ANNOUNCEMENT / POST_PINNED). */
    @Builder.Default
    private boolean announcementNotifications = true;
}
