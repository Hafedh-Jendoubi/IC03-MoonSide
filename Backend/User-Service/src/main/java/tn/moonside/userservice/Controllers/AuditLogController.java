package tn.moonside.userservice.controllers;

import tn.moonside.userservice.dtos.responses.ApiResponse;
import tn.moonside.userservice.dtos.responses.AuditLogResponse;
import tn.moonside.userservice.services.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * GET /audit-logs?page=0&size=20&userId=...&action=LOGIN_SUCCESS&success=true
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String userId,
            @RequestParam(required = false)    String action,
            @RequestParam(required = false)    Boolean success) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AuditLogResponse> result;

        if (userId != null && !userId.isBlank()) {
            result = auditLogService.findByUser(userId, pageable);
        } else if (action != null && !action.isBlank()) {
            result = auditLogService.findByAction(action, pageable);
        } else if (success != null) {
            result = auditLogService.findBySuccess(success, pageable);
        } else {
            result = auditLogService.findAll(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(result, "Audit logs retrieved"));
    }

    /** GET /audit-logs/stats — quick summary for dashboard widgets */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats() {
        Map<String, Long> stats = Map.of(
                "total",   auditLogService.countTotal(),
                "success", auditLogService.countSuccess(),
                "failure", auditLogService.countFailure()
        );
        return ResponseEntity.ok(ApiResponse.success(stats, "Stats retrieved"));
    }
}
