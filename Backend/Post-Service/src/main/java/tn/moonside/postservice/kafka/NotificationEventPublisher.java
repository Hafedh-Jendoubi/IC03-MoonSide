package tn.moonside.postservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tn.moonside.postservice.event.NotificationEvent;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventPublisher {

    private final KafkaTemplate<String, NotificationEvent> kafkaTemplate;

    @Value("${kafka.topic.notifications:notifications-events}")
    private String notificationsTopic;

    /**
     * Publishes a notification event to Kafka.
     * Uses recipientId as the message key to guarantee ordering per user.
     */
    public void publish(NotificationEvent event) {
        try {
            kafkaTemplate.send(notificationsTopic, event.getRecipientId(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish notification event", ex);
                        } else {
                            log.debug("Notification event published: type={} recipient={}",
                                    event.getNotificationType(), event.getRecipientId());
                        }
                    });
        } catch (Exception e) {
            // Notification failures must NEVER break the main flow
            log.error("Error publishing notification event", e);
        }
    }
}