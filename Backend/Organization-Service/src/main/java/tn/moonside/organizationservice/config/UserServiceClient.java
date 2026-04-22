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
 * to displayable info (name, avatar, etc.) and to manage leader roles.
 *
 * Calls go through the internal /users/internal/** endpoints so that no
 * USER_READ or USER_ASSIGN_ROLE permission is required on the caller's token.
 * A valid JWT is still forwarded so the user-service can authenticate the call.
 *
 * If the user-service is unreachable we return an empty Optional / log a warning
 * so the caller can degrade gracefully rather than blowing up.
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

    // ── User lookup ───────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<UserSummary> findById(String userId) {
        if (userId == null || userId.isBlank()) return Optional.empty();
        try {
            HttpHeaders headers = buildHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    userServiceUrl + "/users/internal/" + userId,
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

    // ── Leader role management ────────────────────────────────────────────────

    /**
     * Assigns a leader role (e.g. "TEAM_LEADER" or "DEPARTMENT_LEADER") to a user.
     * Silently ignores duplicate-assignment errors (role already assigned).
     */
    public void assignLeaderRole(String userId, String roleName) {
        if (userId == null || userId.isBlank()) return;
        try {
            HttpHeaders headers = buildHeaders();
            headers.set(HttpHeaders.CONTENT_TYPE, "application/json");

            // Look up role ID by name first, then assign by ID
            String roleId = findRoleIdByName(roleName);
            if (roleId == null) {
                log.warn("Role '{}' not found in user-service — cannot assign to user {}", roleName, userId);
                return;
            }

            Map<String, String> body = Map.of(
                    "roleId", roleId,
                    "scopeType", "GLOBAL",
                    "scopeId", "GLOBAL");

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            restTemplate.exchange(
                    userServiceUrl + "/users/internal/" + userId + "/roles",
                    HttpMethod.POST,
                    entity,
                    Map.class);

            log.info("Assigned role '{}' to user {}", roleName, userId);
        } catch (Exception e) {
            // 409 Conflict means already assigned — that's fine
            log.warn("Could not assign role '{}' to user {}: {}", roleName, userId, e.getMessage());
        }
    }

    /**
     * Revokes a leader role (e.g. "TEAM_LEADER" or "DEPARTMENT_LEADER") from a user.
     * Silently ignores not-found errors.
     */
    public void revokeLeaderRole(String userId, String roleName) {
        if (userId == null || userId.isBlank()) return;
        try {
            HttpHeaders headers = buildHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            restTemplate.exchange(
                    userServiceUrl + "/users/internal/" + userId + "/roles/" + roleName,
                    HttpMethod.DELETE,
                    entity,
                    Map.class);
            log.info("Revoked role '{}' from user {}", roleName, userId);
        } catch (Exception e) {
            log.warn("Could not revoke role '{}' from user {}: {}", roleName, userId, e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String findRoleIdByName(String roleName) {
        try {
            HttpHeaders headers = buildHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    userServiceUrl + "/roles",
                    HttpMethod.GET,
                    entity,
                    Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null || !Boolean.TRUE.equals(body.get("success"))) return null;
            java.util.List<Map<String, Object>> roles = (java.util.List<Map<String, Object>>) body.get("data");
            if (roles == null) return null;
            return roles.stream()
                    .filter(r -> roleName.equals(r.get("name")))
                    .map(r -> (String) r.get("id"))
                    .findFirst()
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Could not look up role '{}': {}", roleName, e.getMessage());
            return null;
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String token = extractBearerToken();
        if (token != null) {
            headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        }
        return headers;
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