package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.responses.AuditLogResponse;
import tn.moonside.userservice.entities.AuditLog;
import tn.moonside.userservice.repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    public void log(String userId, String entityId, String entityType,
                    String action, String description, boolean success,
                    String oldValue, String newValue, String ipAddress) {
        AuditLog entry = AuditLog.builder()
                .userId(userId)
                .entityId(entityId)
                .entityType(entityType)
                .action(action)
                .description(description)
                .success(success)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(entry);
        log.debug("Audit [{}] {} success={} user={}", action, description, success, userId);
    }

    @Override
    public Page<AuditLogResponse> findAll(Pageable pageable) {
        return auditLogRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    public Page<AuditLogResponse> findByUser(String userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable).map(this::toResponse);
    }

    @Override
    public Page<AuditLogResponse> findByAction(String action, Pageable pageable) {
        return auditLogRepository.findByAction(action, pageable).map(this::toResponse);
    }

    @Override
    public Page<AuditLogResponse> findBySuccess(boolean success, Pageable pageable) {
        return auditLogRepository.findBySuccess(success, pageable).map(this::toResponse);
    }

    @Override
    public Page<AuditLogResponse> findByEntityType(String entityType, Pageable pageable) {
        return auditLogRepository.findByEntityType(entityType, pageable).map(this::toResponse);
    }

    @Override
    public long countTotal() {
        return auditLogRepository.count();
    }

    @Override
    public long countSuccess() {
        return auditLogRepository.countBySuccess(true);
    }

    @Override
    public long countFailure() {
        return auditLogRepository.countBySuccess(false);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .entityId(log.getEntityId())
                .entityType(log.getEntityType())
                .action(log.getAction())
                .description(log.getDescription())
                .success(log.isSuccess())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
