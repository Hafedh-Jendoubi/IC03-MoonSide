package tn.moonside.postservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tn.moonside.postservice.entities.Post;

import java.util.HashMap;
import java.util.Map;

/**
 * Publishes post UPSERT / DELETE events to search.index.posts so the
 * Search Service can keep its Elasticsearch index in sync.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SearchIndexPublisher {

    private static final String TOPIC = "search.index.posts";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishUpsert(Post post, String authorName) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("action", "UPSERT");
            event.put("id", post.getId());
            event.put("content", post.getContent() != null ? post.getContent() : "");
            event.put("authorId", post.getAuthorId() != null ? post.getAuthorId() : "");
            event.put("authorName", authorName != null ? authorName : "");
            event.put("postType", post.getPostType() != null ? post.getPostType().name() : "");
            event.put("postVisibility", post.getPostVisibility() != null ? post.getPostVisibility().name() : "");
            event.put("createdAt", post.getCreatedAt() != null ? post.getCreatedAt().toString() : "");
            kafkaTemplate.send(TOPIC, post.getId(), event);
        } catch (Exception e) {
            log.warn("Could not publish search index event for post {}: {}", post.getId(), e.getMessage());
        }
    }

    public void publishDelete(String postId) {
        try {
            Map<String, Object> event = Map.of("action", "DELETE", "id", postId);
            kafkaTemplate.send(TOPIC, postId, event);
        } catch (Exception e) {
            log.warn("Could not publish delete event for post {}: {}", postId, e.getMessage());
        }
    }
}
