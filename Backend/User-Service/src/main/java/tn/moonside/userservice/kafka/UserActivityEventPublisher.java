package tn.moonside.userservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tn.moonside.userservice.event.UserActivityEvent;

import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserActivityEventPublisher {

    private final KafkaTemplate<String, UserActivityEvent> userActivityKafkaTemplate;

    @Value("${kafka.topic.user-activity:user-activity-events}")
    private String userActivityTopic;

    /**
     * Publishes a badge-relevant activity event completely asynchronously on a
     * separate thread — Kafka being down or slow can NEVER block the login flow.
     */
    public void publish(UserActivityEvent event) {
        CompletableFuture.runAsync(() -> {
            try {
                userActivityKafkaTemplate.send(userActivityTopic, event.getUserId(), event)
                        .whenComplete((result, ex) -> {
                            if (ex != null) {
                                log.warn("Failed to publish user activity event type={} user={}",
                                        event.getActivityType(), event.getUserId(), ex);
                            } else {
                                log.debug("User activity event published: type={} user={}",
                                        event.getActivityType(), event.getUserId());
                            }
                        });
            } catch (Exception e) {
                log.warn("Error publishing user activity event type={} user={}",
                        event.getActivityType(), event.getUserId(), e);
            }
        });
    }
}