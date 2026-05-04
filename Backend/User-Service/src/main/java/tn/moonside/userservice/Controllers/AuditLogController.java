package tn.moonside.userservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.moonside.userservice.dtos.responses.ApiResponse;
import tn.moonside.userservice.dtos.responses.AuditLogResponse;
import tn.moonside.userservice.security.AppPermission;
import tn.moonside.userservice.security.RequiresPermission;
import tn.moonside.userservice.services.AuditLogService;

import java.util.Map;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * Query audit logs with optional filters.
     *
     * GET /audit-logs?page=0&size=20
     *                &userId=...
     *                &action=TEAM_CREATED
     *                &entityType=TEAM        ← NEW — filter by TEAM, DEPARTMENT, USER, etc.
     *                &success=true
     *
     * Requires AUDIT_LOG_READ permission.
     */
    @GetMapping
    @RequiresPermission(AppPermission.AUDIT_LOG_READ)
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String userId,
            @RequestParam(required = false)    String action,
            @RequestParam(required = false)    String entityType,
            @RequestParam(required = false)    Boolean success) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AuditLogResponse> result;

        if (userId != null && !userId.isBlank()) {
            result = auditLogService.findByUser(userId, pageable);
        } else if (action != null && !action.isBlank()) {
            result = auditLogService.findByAction(action, pageable);
        } else if (entityType != null && !entityType.isBlank()) {
            result = auditLogService.findByEntityType(entityType, pageable);
        } else if (success != null) {
            result = auditLogService.findBySuccess(success, pageable);
        } else {
            result = auditLogService.findAll(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(result, "Audit logs retrieved"));
    }

    /**
     * Quick summary counts for dashboard widgets.
     * GET /audit-logs/stats
     * Requires AUDIT_LOG_STATS permission.
     */
    @GetMapping("/stats")
    @RequiresPermission(AppPermission.AUDIT_LOG_STATS)
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats() {
        Map<String, Long> stats = Map.of(
                "total",   auditLogService.countTotal(),
                "success", auditLogService.countSuccess(),
                "failure", auditLogService.countFailure()
        );
        return ResponseEntity.ok(ApiResponse.success(stats, "Stats retrieved"));
    }
}
