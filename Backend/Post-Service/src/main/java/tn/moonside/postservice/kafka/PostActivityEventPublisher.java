package tn.moonside.postservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tn.moonside.postservice.event.PostActivityEvent;

import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class PostActivityEventPublisher {

    private final KafkaTemplate<String, PostActivityEvent> postActivityKafkaTemplate;

    @Value("${kafka.topic.post-activity:post-activity-events}")
    private String postActivityTopic;

    /**
     * Publishes on a background thread — Kafka being slow or unavailable
     * can NEVER block the post creation HTTP response.
     */
    public void publish(PostActivityEvent event) {
        CompletableFuture.runAsync(() -> {
            try {
                postActivityKafkaTemplate.send(postActivityTopic, event.getAuthorId(), event)
                        .whenComplete((result, ex) -> {
                            if (ex != null) {
                                log.warn("Failed to publish post activity event user={}: {}",
                                        event.getAuthorId(), ex.getMessage());
                            } else {
                                log.debug("Post activity event published: user={} total={}",
                                        event.getAuthorId(), event.getTotalPosts());
                            }
                        });
            } catch (Exception e) {
                log.warn("Error publishing post activity event user={}: {}",
                        event.getAuthorId(), e.getMessage());
            }
        });
    }
}
