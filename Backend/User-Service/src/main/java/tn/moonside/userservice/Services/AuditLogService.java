package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.responses.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {

    /** Record a new audit event */
    void log(String userId, String entityId, String entityType,
             String action, String description, boolean success,
             String oldValue, String newValue, String ipAddress);

    Page<AuditLogResponse> findAll(Pageable pageable);
    Page<AuditLogResponse> findByUser(String userId, Pageable pageable);
    Page<AuditLogResponse> findByAction(String action, Pageable pageable);
    Page<AuditLogResponse> findBySuccess(boolean success, Pageable pageable);

    /** Filter by entity type (e.g. "TEAM", "DEPARTMENT", "USER") */
    Page<AuditLogResponse> findByEntityType(String entityType, Pageable pageable);

    /** Summary counts for dashboard widgets */
    long countTotal();
    long countSuccess();
    long countFailure();
}
