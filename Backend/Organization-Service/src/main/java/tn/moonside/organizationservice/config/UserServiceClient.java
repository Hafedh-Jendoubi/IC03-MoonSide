package tn.moonside.organizationservice.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
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
 *
 * The JWT Authorization header from the current request is forwarded so
 * that the user-service authenticates the inter-service call correctly.
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
            HttpHeaders headers = new HttpHeaders();

            // Forward the JWT token from the current incoming request so that
            // the user-service can authenticate this inter-service call.
            String token = extractBearerToken();
            if (token != null) {
                headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + token);
            }

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    userServiceUrl + "/users/" + userId,
                    HttpMethod.GET,
                    entity,
                    Map.class);

            Map<String, Object> response = responseEntity.getBody();
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

    /**
     * Extracts the raw JWT value (without the "Bearer " prefix) from the
     * Authorization header of the currently active HTTP request, or returns
     * null if there is no active request / no token present.
     */
    private String extractBearerToken() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;

            HttpServletRequest request = attrs.getRequest();
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7);
            }
        } catch (Exception e) {
            log.debug("Could not extract bearer token from current request: {}", e.getMessage());
        }
        return null;
    }

    private String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v == null ? null : v.toString();
    }
}