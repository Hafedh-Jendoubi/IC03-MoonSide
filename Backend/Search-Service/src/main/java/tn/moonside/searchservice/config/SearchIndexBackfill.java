package tn.moonside.searchservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
@Slf4j
public class SearchIndexBackfill {

    private final RestTemplate restTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void triggerBackfill() {
        try {
            Thread.sleep(15_000); // extra buffer for services to register with Eureka
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }

        triggerReindex("http://user-service:8081/users/internal/reindex", "users");
        triggerReindex("http://organization-service:8084/organizations/departments/internal/reindex", "departments");
        triggerReindex("http://organization-service:8084/organizations/teams/internal/reindex", "teams");
        triggerReindex("http://post-service:8085/posts/internal/reindex", "posts");
    }

    private void triggerReindex(String url, String entity) {
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, null, String.class);
            log.info("Search backfill triggered for {}: {}", entity, response.getBody());
        } catch (Exception e) {
            log.error("Could not trigger search backfill for {} at {}: {}", entity, url, e.getMessage());
        }
    }
}
