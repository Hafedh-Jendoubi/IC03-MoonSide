package tn.moonside.searchservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tn.moonside.searchservice.dto.SearchDto;
import tn.moonside.searchservice.service.SearchService;

/**
 * Listens to Kafka topics published by other microservices and keeps
 * Elasticsearch indices in sync automatically.
 *
 * Topic naming convention:  search.index.<entity>
 * Each service publishes a UserIndexEvent / TeamIndexEvent / etc.
 * with action = UPSERT | DELETE.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SearchKafkaConsumer {

    private final SearchService searchService;

    @KafkaListener(topics = "search.index.users", groupId = "search-service")
    public void onUserEvent(SearchDto.UserIndexEvent event) {
        log.debug("Received user index event: action={}, id={}", event.getAction(), event.getId());
        try {
            searchService.indexUser(event);
        } catch (Exception e) {
            log.error("Failed to index user {}: {}", event.getId(), e.getMessage());
        }
    }

    @KafkaListener(topics = "search.index.teams", groupId = "search-service")
    public void onTeamEvent(SearchDto.TeamIndexEvent event) {
        log.debug("Received team index event: action={}, id={}", event.getAction(), event.getId());
        try {
            searchService.indexTeam(event);
        } catch (Exception e) {
            log.error("Failed to index team {}: {}", event.getId(), e.getMessage());
        }
    }

    @KafkaListener(topics = "search.index.departments", groupId = "search-service")
    public void onDepartmentEvent(SearchDto.DepartmentIndexEvent event) {
        log.debug("Received department index event: action={}, id={}", event.getAction(), event.getId());
        try {
            searchService.indexDepartment(event);
        } catch (Exception e) {
            log.error("Failed to index department {}: {}", event.getId(), e.getMessage());
        }
    }

    @KafkaListener(topics = "search.index.posts", groupId = "search-service")
    public void onPostEvent(SearchDto.PostIndexEvent event) {
        log.debug("Received post index event: action={}, id={}", event.getAction(), event.getId());
        try {
            searchService.indexPost(event);
        } catch (Exception e) {
            log.error("Failed to index post {}: {}", event.getId(), e.getMessage());
        }
    }
}
