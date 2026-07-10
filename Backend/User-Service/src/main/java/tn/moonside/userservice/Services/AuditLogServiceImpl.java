package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.responses.ActivityStatsResponse;
import tn.moonside.userservice.dtos.responses.AuditLogResponse;
import tn.moonside.userservice.entities.AuditLog;
import tn.moonside.userservice.repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

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

    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    @Override
    public ActivityStatsResponse getActivityStats() {
        LocalDateTime last30 = LocalDate.now().minusDays(29).atStartOfDay();
        List<AuditLog> recent = auditLogRepository.findByCreatedAtGreaterThanEqual(last30);

        Map<Integer, Long> hourly = new TreeMap<>();
        for (int h = 0; h < 24; h++) hourly.put(h, 0L);
        for (AuditLog log : recent) {
            if (log.getCreatedAt() == null) continue;
            hourly.merge(log.getCreatedAt().getHour(), 1L, Long::sum);
        }
        List<ActivityStatsResponse.HourlyCount> activityByHour = hourly.entrySet().stream()
                .map(e -> ActivityStatsResponse.HourlyCount.builder().hour(e.getKey()).count(e.getValue()).build())
                .collect(Collectors.toList());

        Map<String, Long> loginsPerDayMap = recent.stream()
                .filter(l -> "LOGIN_SUCCESS".equals(l.getAction()) && l.getCreatedAt() != null)
                .collect(Collectors.groupingBy(l -> l.getCreatedAt().toLocalDate().format(DAY_FMT),
                        Collectors.counting()));

        List<ActivityStatsResponse.DailyCount> loginsPerDay = new ArrayList<>();
        LocalDate start = LocalDate.now().minusDays(13);
        for (int i = 0; i < 14; i++) {
            String key = start.plusDays(i).format(DAY_FMT);
            loginsPerDay.add(ActivityStatsResponse.DailyCount.builder()
                    .date(key)
                    .count(loginsPerDayMap.getOrDefault(key, 0L))
                    .build());
        }

        List<ActivityStatsResponse.NamedCount> topActions = recent.stream()
                .filter(l -> l.getAction() != null)
                .collect(Collectors.groupingBy(AuditLog::getAction, Collectors.counting()))
                .entrySet().stream()
                .map(e -> ActivityStatsResponse.NamedCount.builder().name(e.getKey()).count(e.getValue()).build())
                .sorted(Comparator.comparingLong(ActivityStatsResponse.NamedCount::getCount).reversed())
                .limit(8)
                .collect(Collectors.toList());

        long totalLogins = recent.stream().filter(l -> "LOGIN_SUCCESS".equals(l.getAction())).count();

        return ActivityStatsResponse.builder()
                .activityByHour(activityByHour)
                .loginsPerDay(loginsPerDay)
                .topActions(topActions)
                .totalEventsLast30Days(recent.size())
                .totalLoginsLast30Days(totalLogins)
                .build();
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
