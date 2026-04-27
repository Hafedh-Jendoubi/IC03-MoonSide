package tn.moonside.userservice.controllers;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.moonside.userservice.dtos.responses.ApiResponse;
import tn.moonside.userservice.services.AuditLogService;

import java.util.Map;

/**
 * Internal endpoint consumed by other micro-services (e.g. Organization-Service)
 * to push audit events into the shared audit_logs collection.
 *
 * Secured by the same JWT shared secret — callers must present a valid Bearer token.
 * No explicit permission check is applied here; only service-to-service calls
 * (which forward the user's JWT) should reach this endpoint.
 *
 * Route: POST /audit-logs/internal
 */
@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
@Slf4j
public class AuditLogInternalController {

    private final AuditLogService auditLogService;

    /**
     * Accept an audit log entry from another service.
     *
     * Expected JSON body (all fields optional except action):
     * {
     *   "userId":      "...",
     *   "entityId":    "...",
     *   "entityType":  "TEAM | DEPARTMENT | ...",
     *   "action":      "TEAM_CREATED",
     *   "description": "...",
     *   "success":     true,
     *   "oldValue":    "...",
     *   "newValue":    "...",
     *   "ipAddress":   "..."
     * }
     */
    @PostMapping("/internal")
    public ResponseEntity<ApiResponse<Void>> ingest(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        String userId      = str(body, "userId");
        String entityId    = str(body, "entityId");
        String entityType  = str(body, "entityType");
        String action      = str(body, "action");
        String description = str(body, "description");
        boolean success    = Boolean.TRUE.equals(body.get("success"));
        String oldValue    = str(body, "oldValue");
        String newValue    = str(body, "newValue");
        // Prefer IP from payload (forwarded by caller); fall back to request remote addr
        String ipAddress   = str(body, "ipAddress");
        if (ipAddress == null || ipAddress.isBlank()) {
            ipAddress = request.getRemoteAddr();
        }

        if (action == null || action.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("'action' field is required"));
        }

        auditLogService.log(userId, entityId, entityType, action,
                description, success, oldValue, newValue, ipAddress);

        log.debug("Audit ingested from remote service: action={} entityType={} entityId={}",
                action, entityType, entityId);

        return ResponseEntity.ok(ApiResponse.success(null, "Audit event recorded"));
    }

    private String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v == null ? null : v.toString();
    }
}
