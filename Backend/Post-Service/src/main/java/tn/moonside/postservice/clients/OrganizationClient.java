package tn.moonside.postservice.clients;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

/**
 * Thin HTTP client that calls Organization-Service to check team / department
 * leadership and membership.
 *
 * All methods are fail-safe: any network / HTTP error returns false / null
 * so a transient unavailability of org-service never blocks the post-edit path.
 */
@Component
@Slf4j
public class OrganizationClient {

    private final RestTemplate restTemplate;
    private final String orgServiceUrl;

    public OrganizationClient(
            RestTemplate restTemplate,
            @Value("${services.organization-service.url:http://localhost:8082}") String orgServiceUrl) {
        this.restTemplate = restTemplate;
        this.orgServiceUrl = orgServiceUrl;
    }

    // ── Team checks ───────────────────────────────────────────────────────────

    /**
     * Returns true if {@code userId} is the designated lead of team {@code teamId}.
     */
    public boolean isTeamLead(String teamId, String userId) {
        if (teamId == null || userId == null) return false;
        try {
            Map<?, ?> data = fetchData(orgServiceUrl + "/organizations/teams/" + teamId);
            if (data == null) return false;
            return userId.equals(data.get("leadId"));
        } catch (Exception e) {
            log.warn("isTeamLead check failed team={} user={}: {}", teamId, userId, e.getMessage());
            return false;
        }
    }

    // ── Department checks ─────────────────────────────────────────────────────

    /**
     * Returns true if {@code userId} is the manager of department {@code deptId}.
     */
    public boolean isDepartmentManager(String deptId, String userId) {
        if (deptId == null || userId == null) return false;
        try {
            Map<?, ?> data = fetchData(orgServiceUrl + "/organizations/departments/" + deptId);
            if (data == null) return false;
            return userId.equals(data.get("managerId"));
        } catch (Exception e) {
            log.warn("isDepartmentManager check failed dept={} user={}: {}", deptId, userId, e.getMessage());
            return false;
        }
    }

    /**
     * Returns the departmentId of the given team, or null on any error.
     */
    public String getDepartmentIdForTeam(String teamId) {
        if (teamId == null) return null;
        try {
            Map<?, ?> data = fetchData(orgServiceUrl + "/organizations/teams/" + teamId);
            if (data == null) return null;
            Object deptId = data.get("departmentId");
            return deptId instanceof String s ? s : null;
        } catch (Exception e) {
            log.warn("getDepartmentIdForTeam failed team={}: {}", teamId, e.getMessage());
            return null;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    @SuppressWarnings({"unchecked", "rawtypes"})
    private Map<?, ?> fetchData(String url) {
        HttpHeaders headers = buildHeaders();
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<Map> resp = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
        if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) return null;
        Object data = resp.getBody().get("data");
        return data instanceof Map<?, ?> m ? m : null;
    }

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
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7);
            }
        } catch (Exception e) {
            log.debug("Could not extract bearer token: {}", e.getMessage());
        }
        return null;
    }
}
