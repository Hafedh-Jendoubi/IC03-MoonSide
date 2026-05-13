package tn.moonside.postservice.clients;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Thin HTTP client that calls Organization-Service to check team / department
 * leadership, membership, and follow state.
 *
 * All methods are fail-safe: any network / HTTP error returns false / null / empty
 * so a transient unavailability of org-service never blocks the post path.
 */
@Component
@Slf4j
public class OrganizationClient {

    private final RestTemplate restTemplate;
    private final String orgServiceUrl;

    public OrganizationClient(
            RestTemplate restTemplate,
            @Value("${services.organization-service.url:http://localhost:8084}") String orgServiceUrl) {
        this.restTemplate = restTemplate;
        this.orgServiceUrl = orgServiceUrl;
        log.info("OrganizationClient configured with base URL: {}", orgServiceUrl);
    }

    // ── Team checks ───────────────────────────────────────────────────────────

    /** Returns true if {@code userId} is the designated lead of team {@code teamId}. */
    public boolean isTeamLead(String teamId, String userId) {
        if (teamId == null || userId == null) return false;
        try {
            Map<?, ?> data = fetchData(orgServiceUrl + "/organizations/teams/" + teamId);
            if (data == null) return false;
            return userId.equals(data.get("leadId"));
        } catch (Exception e) {
            log.error("isTeamLead check failed — org-service unreachable? team={} user={}: {}", teamId, userId, e.getMessage());
            return false;
        }
    }

    // ── Department checks ─────────────────────────────────────────────────────

    /** Returns true if {@code userId} is the manager of department {@code deptId}. */
    public boolean isDepartmentManager(String deptId, String userId) {
        if (deptId == null || userId == null) return false;
        try {
            Map<?, ?> data = fetchData(orgServiceUrl + "/organizations/departments/" + deptId);
            if (data == null) return false;
            return userId.equals(data.get("managerId"));
        } catch (Exception e) {
            log.error("isDepartmentManager check failed — org-service unreachable? dept={} user={}: {}", deptId, userId, e.getMessage());
            return false;
        }
    }

    /** Returns the departmentId of the given team, or null on any error. */
    public String getDepartmentIdForTeam(String teamId) {
        if (teamId == null) return null;
        try {
            Map<?, ?> data = fetchData(orgServiceUrl + "/organizations/teams/" + teamId);
            if (data == null) return null;
            Object deptId = data.get("departmentId");
            return deptId instanceof String s ? s : null;
        } catch (Exception e) {
            log.error("getDepartmentIdForTeam failed — org-service unreachable? team={}: {}", teamId, e.getMessage());
            return null;
        }
    }

    // ── Follow feed ───────────────────────────────────────────────────────────

    /**
     * Returns the IDs of departments that the current authenticated user follows.
     * Returns an empty list on any error.
     */
    @SuppressWarnings("unchecked")
    public List<String> getFollowedDepartmentIds() {
        try {
            Map<?, ?> data = fetchData(orgServiceUrl + "/organizations/follows/mine");
            if (data == null) return Collections.emptyList();
            Object list = data.get("followedDepartmentIds");
            return list instanceof List<?> l ? (List<String>) l : Collections.emptyList();
        } catch (Exception e) {
            log.error("getFollowedDepartmentIds failed — org-service unreachable?: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Returns the IDs of teams that the current authenticated user follows.
     * Returns an empty list on any error.
     */
    @SuppressWarnings("unchecked")
    public List<String> getFollowedTeamIds() {
        try {
            Map<?, ?> data = fetchData(orgServiceUrl + "/organizations/follows/mine");
            if (data == null) return Collections.emptyList();
            Object list = data.get("followedTeamIds");
            return list instanceof List<?> l ? (List<String>) l : Collections.emptyList();
        } catch (Exception e) {
            log.error("getFollowedTeamIds failed — org-service unreachable?: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Single call that returns both lists at once so we only hit org-service once
     * per feed request. Returns a two-element array: [departmentIds, teamIds].
     */
    @SuppressWarnings("unchecked")
    public UserFollows getUserFollows() {
        try {
            Map<?, ?> data = fetchData(orgServiceUrl + "/organizations/follows/mine");
            if (data == null) return UserFollows.empty();

            Object depts = data.get("followedDepartmentIds");
            Object teams = data.get("followedTeamIds");

            List<String> departmentIds = depts instanceof List<?> l ? (List<String>) l : Collections.emptyList();
            List<String> teamIds       = teams instanceof List<?> l ? (List<String>) l : Collections.emptyList();

            return new UserFollows(departmentIds, teamIds);
        } catch (Exception e) {
            log.error("getUserFollows failed — org-service unreachable?: {}", e.getMessage());
            return UserFollows.empty();
        }
    }

    /** Value-object returned by {@link #getUserFollows()}. */
    public record UserFollows(List<String> departmentIds, List<String> teamIds) {
        public static UserFollows empty() {
            return new UserFollows(Collections.emptyList(), Collections.emptyList());
        }
        public boolean hasAnyFollows() {
            return !departmentIds.isEmpty() || !teamIds.isEmpty();
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
