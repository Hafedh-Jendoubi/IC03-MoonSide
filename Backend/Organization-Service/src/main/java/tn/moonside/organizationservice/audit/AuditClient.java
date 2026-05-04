package tn.moonside.organizationservice.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

/**
 * Fires-and-forgets audit log entries to the User-Service.
 *
 * The call is best-effort: any exception is swallowed so that a
 * transient user-service outage never breaks an organisation operation.
 *
 * Endpoint: POST {user-service}/audit-logs/internal
 */
@Component
@Slf4j
public class AuditClient {

    private final RestTemplate restTemplate;
    private final String userServiceUrl;

    public AuditClient(
            RestTemplate restTemplate,
            @Value("${services.user-service.url}") String userServiceUrl) {
        this.restTemplate  = restTemplate;
        this.userServiceUrl = userServiceUrl;
    }

    /**
     * Send an audit entry asynchronously (best-effort, non-blocking to the caller).
     */
    public void log(String userId,
                    String entityId,
                    String entityType,
                    String action,
                    String description,
                    boolean success,
                    String oldValue,
                    String newValue) {

        String ip = resolveClientIp();

        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("userId",      userId);
        body.put("entityId",    entityId);
        body.put("entityType",  entityType);
        body.put("action",      action);
        body.put("description", description);
        body.put("success",     success);
        body.put("oldValue",    oldValue);
        body.put("newValue",    newValue);
        body.put("ipAddress",   ip);

        try {
            HttpHeaders headers = buildHeaders();
            headers.set(HttpHeaders.CONTENT_TYPE, "application/json");
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            restTemplate.exchange(
                    userServiceUrl + "/audit-logs/internal",
                    HttpMethod.POST,
                    entity,
                    Map.class);

            log.debug("Audit sent: action={} entityType={} entityId={} success={}",
                    action, entityType, entityId, success);

        } catch (Exception e) {
            // Best-effort — log and swallow; never break the caller
            log.warn("Could not send audit log to user-service (action={} entity={}): {}",
                    action, entityId, e.getMessage());
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

    private String resolveClientIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest req = attrs.getRequest();
            String forwarded = req.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
            return req.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }
}
