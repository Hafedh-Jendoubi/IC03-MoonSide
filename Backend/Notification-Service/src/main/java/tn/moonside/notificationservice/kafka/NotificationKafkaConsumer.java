package tn.moonside.notificationservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tn.moonside.notificationservice.event.NotificationEvent;
import tn.moonside.notificationservice.service.NotificationService;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationKafkaConsumer {

    private final NotificationService notificationService;

    @KafkaListener(
        topics = "${kafka.topic.notifications:notifications-events}",
        groupId = "${spring.kafka.consumer.group-id:notification-service-group}"
    )
    public void consume(NotificationEvent event) {
        log.info("Received notification event: type={} recipient={} sender={}",
                event.getNotificationType(), event.getRecipientId(), event.getSenderId());
        try {
            notificationService.processEvent(event);
        } catch (Exception e) {
            log.error("Failed to process notification event: {}", e.getMessage(), e);
        }
    }
}
