package tn.moonside.searchservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * On every startup, asks the User Service and Organization Service to
 * re-publish all their existing records to the Kafka search index topics.
 *
 * This ensures the Elasticsearch index is always populated even after a
 * fresh deploy or Search Service restart, without requiring manual intervention.
 *
 * The endpoints are internal (no auth) and only reachable inside Docker network.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SearchIndexBackfill {

    private final RestTemplate restTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void triggerBackfill() {
        // Small delay to let other services finish startup and register with Eureka
        try {
            Thread.sleep(10_000);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }

        triggerReindex("http://user-service:8081/users/internal/reindex", "users");
        triggerReindex("http://organization-service:8084/organizations/departments/internal/reindex", "departments");
        triggerReindex("http://organization-service:8084/organizations/teams/internal/reindex", "teams");
    }

    private void triggerReindex(String url, String entity) {
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, null, String.class);
            log.info("Search backfill triggered for {}: {}", entity, response.getBody());
        } catch (Exception e) {
            // Non-fatal — Kafka events from future creates/updates will still index correctly.
            // The backfill can be re-triggered by restarting the search-service container.
            log.warn("Could not trigger search backfill for {}: {}", entity, e.getMessage());
        }
    }
}
