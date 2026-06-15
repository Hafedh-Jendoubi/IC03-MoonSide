package tn.moonside.notificationservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tn.moonside.notificationservice.dto.NotificationResponse;
import tn.moonside.notificationservice.entity.Notification;
import tn.moonside.notificationservice.event.NotificationEvent;
import tn.moonside.notificationservice.repository.NotificationRepository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Active SSE emitters keyed by userId.
     * ConcurrentHashMap + CopyOnWriteArrayList allows multiple tabs per user.
     */
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    // ── SSE subscription ──────────────────────────────────────────────────────

    /**
     * Creates an SSE emitter for the given user and registers clean-up callbacks.
     * Sends an initial "connected" event so the browser knows the stream is live.
     */
    public SseEmitter subscribe(String userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(()    -> removeEmitter(userId, emitter));
        emitter.onError(e       -> removeEmitter(userId, emitter));

        // Send a heartbeat so the client can confirm connection
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        log.debug("SSE subscribed for user {}", userId);
        return emitter;
    }

    // ── Kafka consumer entry point ────────────────────────────────────────────

    /**
     * Called by the Kafka consumer whenever a notification event arrives.
     * Persists the notification and pushes it over SSE to connected clients.
     */
    public void processEvent(NotificationEvent event) {
        // Don't notify users of their own actions
        if (event.getRecipientId() == null ||
                event.getRecipientId().equals(event.getSenderId())) {
            return;
        }

        Notification notification = Notification.builder()
                .recipientId(event.getRecipientId())
                .senderId(event.getSenderId())
                .notificationType(event.getNotificationType())
                .title(event.getTitle())
                .body(event.getBody())
                .resourceId(event.getResourceId())
                .resourceType(event.getResourceType())
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Notification saved: {} for user {}", saved.getId(), saved.getRecipientId());

        // Push real-time to connected SSE clients
        pushToUser(saved.getRecipientId(), toResponse(saved));
    }

    // ── REST API helpers ──────────────────────────────────────────────────────

    public Page<NotificationResponse> getNotifications(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    public NotificationResponse markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        if (!notification.getRecipientId().equals(userId)) {
            throw new SecurityException("Access denied");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository
                .findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        LocalDateTime now = LocalDateTime.now();
        unread.forEach(n -> {
            n.setRead(true);
            n.setReadAt(now);
        });
        notificationRepository.saveAll(unread);
    }

    public void deleteNotification(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        if (!notification.getRecipientId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        notificationRepository.delete(notification);
    }

    // ── SSE push ──────────────────────────────────────────────────────────────

    private void pushToUser(String userId, NotificationResponse payload) {
        List<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) return;

        List<SseEmitter> dead = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(payload));
            } catch (IOException e) {
                dead.add(emitter);
                log.debug("Dead SSE emitter removed for user {}", userId);
            }
        }
        userEmitters.removeAll(dead);
    }

    private void removeEmitter(String userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.get(userId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) emitters.remove(userId);
        }
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .recipientId(n.getRecipientId())
                .senderId(n.getSenderId())
                .notificationType(n.getNotificationType())
                .title(n.getTitle())
                .body(n.getBody())
                .resourceId(n.getResourceId())
                .resourceType(n.getResourceType())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .readAt(n.getReadAt())
                .build();
    }

    // ── Heartbeat ─────────────────────────────────────────────────────────────
    /**
     * Sends a comment ping every 25 seconds to all connected SSE clients.
     * This prevents proxies and load balancers from closing idle connections.
     */
    @Scheduled(fixedDelay = 25000)
    public void sendHeartbeat() {
        if (emitters.isEmpty()) return;
        for (Map.Entry<String, CopyOnWriteArrayList<SseEmitter>> entry : emitters.entrySet()) {
            List<SseEmitter> dead = new CopyOnWriteArrayList<>();
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event().comment("heartbeat"));
                } catch (IOException e) {
                    dead.add(emitter);
                }
            }
            entry.getValue().removeAll(dead);
        }
    }
}