package tn.moonside.postservice.clients;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Resolves user IDs to human-readable display names by calling the
 * User-Service internal endpoint ({@code GET /users/internal/{id}}).
 *
 * <p>All methods are fail-safe: any network or HTTP error returns an
 * empty Optional so a transient user-service outage never blocks the
 * post path. The JWT from the current request is forwarded so the
 * user-service can authenticate the call without requiring an elevated
 * permission on the token.</p>
 */
@Component
@Slf4j
public class UserClient {

    private final RestTemplate restTemplate;
    private final String userServiceUrl;

    public UserClient(
            RestTemplate restTemplate,
            @Value("${services.user-service.url}") String userServiceUrl) {
        this.restTemplate  = restTemplate;
        this.userServiceUrl = userServiceUrl;
    }

    /**
     * Looks up a user by ID and returns a {@link UserSummary} on success,
     * or an empty Optional on any error (user not found, service down, etc.).
     */
    @SuppressWarnings("unchecked")
    public Optional<UserSummary> findById(String userId) {
        if (userId == null || userId.isBlank()) return Optional.empty();
        try {
            HttpHeaders headers = buildHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> resp = restTemplate.exchange(
                    userServiceUrl + "/users/internal/" + userId,
                    HttpMethod.GET,
                    entity,
                    Map.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                return Optional.empty();
            }

            Map<String, Object> body = resp.getBody();
            if (!Boolean.TRUE.equals(body.get("success"))) return Optional.empty();

            Map<String, Object> data = (Map<String, Object>) body.get("data");
            if (data == null) return Optional.empty();

            UserSummary summary = UserSummary.builder()
                    .id(userId)
                    .firstName(str(data, "firstName"))
                    .lastName(str(data, "lastName"))
                    .email(str(data, "email"))
                    .jobTitle(str(data, "jobTitle"))
                    .avatarUrl(str(data, "avatarUrl"))
                    .build();
            return Optional.of(summary);

        } catch (Exception e) {
            log.warn("Could not resolve user {} from user-service: {}", userId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Convenience method — returns the display name for {@code userId},
     * falling back to the raw ID if the user-service is unavailable.
     */
    public String displayName(String userId) {
        return findById(userId)
                .map(UserSummary::displayName)
                .orElse(userId);
    }

    /**
     * Searches users by name prefix — used by the mention autocomplete proxy endpoint.
     * Returns an empty list on any error.
     */
    @SuppressWarnings("unchecked")
    public List<UserSummary> searchByName(String query) {
        if (query == null || query.isBlank()) return List.of();
        try {
            HttpHeaders headers = buildHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> resp = restTemplate.exchange(
                    userServiceUrl + "/users/internal/search?q=" + query,
                    HttpMethod.GET, entity, Map.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null)
                return List.of();

            Map<String, Object> body = resp.getBody();
            if (!Boolean.TRUE.equals(body.get("success"))) return List.of();

            List<Map<String, Object>> data = (List<Map<String, Object>>) body.get("data");
            if (data == null) return List.of();

            List<UserSummary> results = new ArrayList<>();
            for (Map<String, Object> u : data) {
                results.add(UserSummary.builder()
                        .id(str(u, "id"))
                        .firstName(str(u, "firstName"))
                        .lastName(str(u, "lastName"))
                        .email(str(u, "email"))
                        .jobTitle(str(u, "jobTitle"))
                        .avatarUrl(str(u, "avatarUrl"))
                        .build());
            }
            return results;
        } catch (Exception e) {
            log.warn("Mention search failed for query '{}': {}", query, e.getMessage());
            return List.of();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String token = extractBearerToken();
        if (token != null) {
            headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        }
        return headers;
    }

    private String extractBearerToken() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest request = attrs.getRequest();
            String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (auth != null && auth.startsWith("Bearer ")) {
                return auth.substring(7);
            }
        } catch (Exception e) {
            log.debug("Could not extract bearer token: {}", e.getMessage());
        }
        return null;
    }

    private String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v == null ? null : v.toString();
    }
}
