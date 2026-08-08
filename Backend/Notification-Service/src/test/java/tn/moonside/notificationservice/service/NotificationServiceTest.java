package tn.moonside.notificationservice.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tn.moonside.notificationservice.dto.NotificationPreferenceDto;
import tn.moonside.notificationservice.dto.NotificationResponse;
import tn.moonside.notificationservice.entity.Notification;
import tn.moonside.notificationservice.entity.NotificationPreference;
import tn.moonside.notificationservice.enums.NotificationType;
import tn.moonside.notificationservice.event.NotificationEvent;
import tn.moonside.notificationservice.repository.NotificationPreferenceRepository;
import tn.moonside.notificationservice.repository.NotificationRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @InjectMocks
    private NotificationService notificationService;

    // ── subscribe ────────────────────────────────────────────────────────────

    @Test
    void subscribe_returnsEmitter() {
        SseEmitter emitter = notificationService.subscribe("user1");

        assertThat(emitter).isNotNull();
    }

    // ── processEvent ─────────────────────────────────────────────────────────

    @Test
    void processEvent_recipientEqualsSender_doesNotSave() {
        NotificationEvent event = NotificationEvent.builder()
                .recipientId("user1")
                .senderId("user1")
                .notificationType(NotificationType.COMMENT)
                .build();

        notificationService.processEvent(event);

        verifyNoInteractions(notificationRepository);
    }

    @Test
    void processEvent_nullRecipient_doesNotSave() {
        NotificationEvent event = NotificationEvent.builder()
                .recipientId(null)
                .senderId("user2")
                .notificationType(NotificationType.COMMENT)
                .build();

        notificationService.processEvent(event);

        verifyNoInteractions(notificationRepository);
    }

    @Test
    void processEvent_categoryDisabled_doesNotSave() {
        NotificationEvent event = NotificationEvent.builder()
                .recipientId("user1")
                .senderId("user2")
                .notificationType(NotificationType.COMMENT)
                .build();

        NotificationPreference preference = NotificationPreference.builder()
                .userId("user1")
                .commentNotifications(false)
                .build();
        when(notificationPreferenceRepository.findByUserId("user1")).thenReturn(Optional.of(preference));

        notificationService.processEvent(event);

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void processEvent_noPreferenceRecord_defaultsToEnabledAndSaves() {
        NotificationEvent event = NotificationEvent.builder()
                .recipientId("user1")
                .senderId("user2")
                .notificationType(NotificationType.COMMENT)
                .title("New comment")
                .body("Someone commented")
                .resourceId("post1")
                .resourceType("POST")
                .build();

        when(notificationPreferenceRepository.findByUserId("user1")).thenReturn(Optional.empty());
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setId("n1");
            return n;
        });

        notificationService.processEvent(event);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getRecipientId()).isEqualTo("user1");
        assertThat(saved.getSenderId()).isEqualTo("user2");
        assertThat(saved.getNotificationType()).isEqualTo(NotificationType.COMMENT);
        assertThat(saved.getTitle()).isEqualTo("New comment");
        assertThat(saved.isRead()).isFalse();
    }

    @Test
    void processEvent_categoryEnabled_savesNotification() {
        NotificationEvent event = NotificationEvent.builder()
                .recipientId("user1")
                .senderId("user2")
                .notificationType(NotificationType.REACTION)
                .build();

        NotificationPreference preference = NotificationPreference.builder()
                .userId("user1")
                .reactionNotifications(true)
                .build();
        when(notificationPreferenceRepository.findByUserId("user1")).thenReturn(Optional.of(preference));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        notificationService.processEvent(event);

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void processEvent_nullType_treatedAsEnabled() {
        NotificationEvent event = NotificationEvent.builder()
                .recipientId("user1")
                .senderId("user2")
                .notificationType(null)
                .build();

        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        notificationService.processEvent(event);

        verify(notificationRepository).save(any(Notification.class));
        verifyNoInteractions(notificationPreferenceRepository);
    }

    // ── preferences ──────────────────────────────────────────────────────────

    @Test
    void getPreferences_existingRecord_returnsDto() {
        NotificationPreference preference = NotificationPreference.builder()
                .userId("user1")
                .badgeEarnedNotifications(false)
                .build();
        when(notificationPreferenceRepository.findByUserId("user1")).thenReturn(Optional.of(preference));

        NotificationPreferenceDto dto = notificationService.getPreferences("user1");

        assertThat(dto.isBadgeEarnedNotifications()).isFalse();
        assertThat(dto.isCommentNotifications()).isTrue(); // default
    }

    @Test
    void getPreferences_noRecord_returnsAllEnabledDefaults() {
        when(notificationPreferenceRepository.findByUserId("user1")).thenReturn(Optional.empty());

        NotificationPreferenceDto dto = notificationService.getPreferences("user1");

        assertThat(dto.isBadgeEarnedNotifications()).isTrue();
        assertThat(dto.isMentionNotifications()).isTrue();
        assertThat(dto.isCommentNotifications()).isTrue();
        assertThat(dto.isReactionNotifications()).isTrue();
        assertThat(dto.isFollowNotifications()).isTrue();
        assertThat(dto.isConnectionNotifications()).isTrue();
        assertThat(dto.isAnnouncementNotifications()).isTrue();
    }

    @Test
    void updatePreferences_existingRecord_updatesAndSaves() {
        NotificationPreference existing = NotificationPreference.builder().userId("user1").build();
        when(notificationPreferenceRepository.findByUserId("user1")).thenReturn(Optional.of(existing));
        when(notificationPreferenceRepository.save(any(NotificationPreference.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        NotificationPreferenceDto update = NotificationPreferenceDto.builder()
                .badgeEarnedNotifications(false)
                .mentionNotifications(false)
                .commentNotifications(true)
                .reactionNotifications(false)
                .followNotifications(true)
                .connectionNotifications(false)
                .announcementNotifications(true)
                .build();

        NotificationPreferenceDto result = notificationService.updatePreferences("user1", update);

        assertThat(result.isBadgeEarnedNotifications()).isFalse();
        assertThat(result.isMentionNotifications()).isFalse();
        assertThat(result.isReactionNotifications()).isFalse();
        assertThat(result.isConnectionNotifications()).isFalse();
        verify(notificationPreferenceRepository).save(existing);
    }

    @Test
    void updatePreferences_noExistingRecord_createsNew() {
        when(notificationPreferenceRepository.findByUserId("user1")).thenReturn(Optional.empty());
        when(notificationPreferenceRepository.save(any(NotificationPreference.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        NotificationPreferenceDto update = NotificationPreferenceDto.builder()
                .badgeEarnedNotifications(false)
                .build();

        NotificationPreferenceDto result = notificationService.updatePreferences("user1", update);

        assertThat(result.isBadgeEarnedNotifications()).isFalse();
        ArgumentCaptor<NotificationPreference> captor = ArgumentCaptor.forClass(NotificationPreference.class);
        verify(notificationPreferenceRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo("user1");
    }

    // ── REST helpers ─────────────────────────────────────────────────────────

    @Test
    void getNotifications_returnsMappedPage() {
        Notification notification = Notification.builder().id("n1").recipientId("user1").build();
        Page<Notification> page = new PageImpl<>(List.of(notification));
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(eq("user1"), any(Pageable.class)))
                .thenReturn(page);

        Page<NotificationResponse> result = notificationService.getNotifications("user1", 0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo("n1");
    }

    @Test
    void getUnreadCount_delegatesToRepository() {
        when(notificationRepository.countByRecipientIdAndIsReadFalse("user1")).thenReturn(5L);

        long count = notificationService.getUnreadCount("user1");

        assertThat(count).isEqualTo(5L);
    }

    @Test
    void markAsRead_unreadNotification_marksAndSaves() {
        Notification notification = Notification.builder()
                .id("n1").recipientId("user1").isRead(false).build();
        when(notificationRepository.findById("n1")).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead("n1", "user1");

        assertThat(response.isRead()).isTrue();
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_alreadyRead_doesNotSaveAgain() {
        Notification notification = Notification.builder()
                .id("n1").recipientId("user1").isRead(true).build();
        when(notificationRepository.findById("n1")).thenReturn(Optional.of(notification));

        NotificationResponse response = notificationService.markAsRead("n1", "user1");

        assertThat(response.isRead()).isTrue();
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAsRead_notFound_throwsIllegalArgumentException() {
        when(notificationRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead("missing", "user1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("missing");
    }

    @Test
    void markAsRead_wrongUser_throwsSecurityException() {
        Notification notification = Notification.builder()
                .id("n1").recipientId("otherUser").isRead(false).build();
        when(notificationRepository.findById("n1")).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> notificationService.markAsRead("n1", "user1"))
                .isInstanceOf(SecurityException.class);

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAllAsRead_marksAllUnreadAndSaves() {
        Notification n1 = Notification.builder().id("n1").recipientId("user1").isRead(false).build();
        Notification n2 = Notification.builder().id("n2").recipientId("user1").isRead(false).build();
        when(notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc("user1"))
                .thenReturn(List.of(n1, n2));

        notificationService.markAllAsRead("user1");

        assertThat(n1.isRead()).isTrue();
        assertThat(n2.isRead()).isTrue();
        verify(notificationRepository).saveAll(anyList());
    }

    @Test
    void deleteNotification_ownedByUser_deletes() {
        Notification notification = Notification.builder().id("n1").recipientId("user1").build();
        when(notificationRepository.findById("n1")).thenReturn(Optional.of(notification));

        notificationService.deleteNotification("n1", "user1");

        verify(notificationRepository).delete(notification);
    }

    @Test
    void deleteNotification_notFound_throwsIllegalArgumentException() {
        when(notificationRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.deleteNotification("missing", "user1"))
                .isInstanceOf(IllegalArgumentException.class);

        verify(notificationRepository, never()).delete(any(Notification.class));
    }

    @Test
    void deleteNotification_wrongUser_throwsSecurityException() {
        Notification notification = Notification.builder().id("n1").recipientId("otherUser").build();
        when(notificationRepository.findById("n1")).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> notificationService.deleteNotification("n1", "user1"))
                .isInstanceOf(SecurityException.class);

        verify(notificationRepository, never()).delete(any(Notification.class));
    }

    // ── Heartbeat ────────────────────────────────────────────────────────────

    @Test
    void sendHeartbeat_noSubscribers_doesNothing() {
        // No emitters registered; should simply return without error.
        notificationService.sendHeartbeat();
    }

    @Test
    void sendHeartbeat_withSubscriber_doesNotThrow() {
        notificationService.subscribe("user1");

        notificationService.sendHeartbeat();
    }
}
