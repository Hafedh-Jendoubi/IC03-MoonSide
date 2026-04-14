package tn.moonside.organizationservice.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import tn.moonside.organizationservice.dtos.responses.UserSummary;

import java.util.Map;
import java.util.Optional;

/**
 * Lightweight REST client that calls the user-service to resolve user IDs
 * to displayable info (name, avatar, etc.).
 *
 * Calls go through the Gateway so Eureka load-balancing is respected.
 * If the user-service is unreachable we return an empty Optional so the
 * caller can degrade gracefully rather than blowing up.
 */
@Component
@Slf4j
public class UserServiceClient {

    private final RestTemplate restTemplate;
    private final String userServiceUrl;

    public UserServiceClient(
            RestTemplate restTemplate,
            @Value("${services.user-service.url}") String userServiceUrl) {
        this.restTemplate = restTemplate;
        this.userServiceUrl = userServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public Optional<UserSummary> findById(String userId) {
        if (userId == null || userId.isBlank()) return Optional.empty();
        try {
            Map<String, Object> response = restTemplate.getForObject(
                    userServiceUrl + "/users/" + userId, Map.class);

            if (response == null || !Boolean.TRUE.equals(response.get("success"))) {
                return Optional.empty();
            }

            Map<String, Object> data = (Map<String, Object>) response.get("data");
            if (data == null) return Optional.empty();

            UserSummary summary = UserSummary.builder()
                    .id(userId)
                    .firstName(str(data, "firstName"))
                    .lastName(str(data, "lastName"))
                    .email(str(data, "email"))
                    .avatar(str(data, "avatar"))
                    .jobTitle(str(data, "jobTitle"))
                    .build();
            return Optional.of(summary);
        } catch (Exception e) {
            log.warn("Could not fetch user {} from user-service: {}", userId, e.getMessage());
            return Optional.empty();
        }
    }

    private String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v == null ? null : v.toString();
    }
}
