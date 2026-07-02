package tn.moonside.badgeservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tn.moonside.badgeservice.events.UserActivityEvent;
import tn.moonside.badgeservice.services.BadgeService;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserActivityKafkaConsumer {

    private final BadgeService badgeService;

    @KafkaListener(
        topics = "${kafka.topic.user-activity:user-activity-events}",
        groupId = "${spring.kafka.consumer.group-id:badge-service-group}",
        containerFactory = "userActivityKafkaListenerContainerFactory"
    )
    public void consume(UserActivityEvent event) {
        log.info("Received user activity event: type={} user={} value={}",
                event.getActivityType(), event.getUserId(), event.getValue());
        try {
            int value = event.getValue() != null ? event.getValue() : 0;
            badgeService.evaluateAndAward(event.getUserId(), event.getActivityType(), value);
        } catch (Exception e) {
            log.error("Failed to evaluate badges for user activity event: {}", e.getMessage(), e);
        }
    }
}
