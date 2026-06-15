package tn.moonside.userservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tn.moonside.userservice.entities.User;

import java.util.Map;

/**
 * Publishes user UPSERT / DELETE events to the search.index.users topic
 * so the Search Service can keep its Elasticsearch index up to date.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SearchIndexPublisher {

    private static final String TOPIC = "search.index.users";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishUpsert(User user) {
        publish("UPSERT", user);
    }

    public void publishDelete(User user) {
        publish("DELETE", user);
    }

    private void publish(String action, User user) {
        try {
            Map<String, Object> event = Map.of(
                    "action", action,
                    "id", user.getId(),
                    "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                    "lastName", user.getLastName() != null ? user.getLastName() : "",
                    "email", user.getEmail() != null ? user.getEmail() : "",
                    "jobTitle", user.getJobTitle() != null ? user.getJobTitle() : "",
                    "avatar", user.getAvatar() != null ? user.getAvatar() : "",
                    "isActive", user.isActive()
            );
            kafkaTemplate.send(TOPIC, user.getId(), event);
            log.debug("Published {} event for user {}", action, user.getId());
        } catch (Exception e) {
            // Non-critical – don't let search indexing break user operations
            log.warn("Could not publish search index event for user {}: {}", user.getId(), e.getMessage());
        }
    }
}
