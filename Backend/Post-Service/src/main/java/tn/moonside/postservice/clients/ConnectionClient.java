package tn.moonside.postservice.clients;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.Map;

/**
 * Resolves a user's connection IDs by calling the User-Service internal
 * endpoint ({@code GET /connections/internal/{userId}/ids}).
 *
 * <p>Fail-safe: any network or HTTP error returns an empty list so a
 * transient User-Service outage never blocks the connections feed — it just
 * comes back empty rather than erroring.</p>
 */
@Component
@Slf4j
public class ConnectionClient {

    private final RestTemplate restTemplate;
    private final String userServiceUrl;

    public ConnectionClient(
            RestTemplate restTemplate,
            @Value("${services.user-service.url}") String userServiceUrl) {
        this.restTemplate = restTemplate;
        this.userServiceUrl = userServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public List<String> getConnectionIds(String userId) {
        if (userId == null || userId.isBlank()) return List.of();
        try {
            HttpHeaders headers = buildHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> resp = restTemplate.exchange(
                    userServiceUrl + "/connections/internal/" + userId + "/ids",
                    HttpMethod.GET, entity, Map.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) return List.of();

            Map<String, Object> body = resp.getBody();
            if (!Boolean.TRUE.equals(body.get("success"))) return List.of();

            Object data = body.get("data");
            if (!(data instanceof List<?> list)) return List.of();

            return list.stream().map(Object::toString).toList();
        } catch (Exception e) {
            log.warn("Could not resolve connections for user {} from user-service: {}", userId, e.getMessage());
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
}
