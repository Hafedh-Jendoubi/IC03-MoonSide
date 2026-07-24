package tn.moonside.badgeservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tn.moonside.badgeservice.events.PostActivityEvent;
import tn.moonside.badgeservice.services.BadgeService;

@Component
@RequiredArgsConstructor
@Slf4j
public class PostActivityKafkaConsumer {

    private final BadgeService badgeService;

    @KafkaListener(
        topics = "${kafka.topic.post-activity:post-activity-events}",
        groupId = "${spring.kafka.consumer.group-id:badge-service-group}",
        containerFactory = "postActivityKafkaListenerContainerFactory"
    )
    public void consume(PostActivityEvent event) {
        log.info("Received post activity event: user={} totalPosts={}",
                event.getAuthorId(), event.getTotalPosts());
        try {
            int total = event.getTotalPosts() != null ? event.getTotalPosts().intValue() : 0;
            badgeService.evaluateAndAward(event.getAuthorId(), event.getActivityType(), total);
        } catch (Exception e) {
            log.error("Failed to evaluate badges for post activity event: {}", e.getMessage(), e);
        }
    }
}
