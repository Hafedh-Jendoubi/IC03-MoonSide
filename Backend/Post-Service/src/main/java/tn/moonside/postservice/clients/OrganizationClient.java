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
     * Single call that returns both explicit-follow lists and implicit-membership
     * lists at once so we only hit org-service once per feed request.
     *
     * <ul>
     *   <li>{@code departmentIds} — departments the user explicitly follows</li>
     *   <li>{@code teamIds}       — teams the user explicitly follows</li>
     *   <li>{@code memberTeamIds} — teams the user is a member of</li>
     *   <li>{@code memberDeptIds} — departments of the user's member teams</li>
     * </ul>
     */
    @SuppressWarnings("unchecked")
    public UserFollows getUserFollows() {
        try {
            Map<?, ?> data = fetchData(orgServiceUrl + "/organizations/follows/mine");
            if (data == null) return UserFollows.empty();

            List<String> followedDepts  = readStringList(data, "followedDepartmentIds");
            List<String> followedTeams  = readStringList(data, "followedTeamIds");
            List<String> memberTeams    = readStringList(data, "memberTeamIds");
            List<String> memberDepts    = readStringList(data, "memberDepartmentIds");

            return new UserFollows(followedDepts, followedTeams, memberTeams, memberDepts);
        } catch (Exception e) {
            log.error("getUserFollows failed — org-service unreachable?: {}", e.getMessage());
            return UserFollows.empty();
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> readStringList(Map<?, ?> data, String key) {
        Object val = data.get(key);
        return val instanceof List<?> l ? (List<String>) l : Collections.emptyList();
    }

    /**
     * Value-object returned by {@link #getUserFollows()}.
     *
     * <p>Combines explicit follows and implicit team membership so the feed
     * query can be built in a single pass.</p>
     */
    public record UserFollows(
            List<String> departmentIds,
            List<String> teamIds,
            List<String> memberTeamIds,
            List<String> memberDepartmentIds) {

        public static UserFollows empty() {
            return new UserFollows(
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList());
        }

        /** True when there is at least one source of posts to show. */
        public boolean hasAnyContent() {
            return !departmentIds.isEmpty()
                    || !teamIds.isEmpty()
                    || !memberTeamIds.isEmpty()
                    || !memberDepartmentIds.isEmpty();
        }

        /**
         * @deprecated Use {@link #hasAnyContent()} — kept for backwards compatibility.
         */
        @Deprecated
        public boolean hasAnyFollows() {
            return hasAnyContent();
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
