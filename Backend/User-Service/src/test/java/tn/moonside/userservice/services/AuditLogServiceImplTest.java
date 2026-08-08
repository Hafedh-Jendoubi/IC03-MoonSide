package tn.moonside.userservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import tn.moonside.userservice.dtos.responses.ActivityStatsResponse;
import tn.moonside.userservice.dtos.responses.AuditLogResponse;
import tn.moonside.userservice.entities.AuditLog;
import tn.moonside.userservice.repositories.AuditLogRepository;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceImplTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogServiceImpl auditLogService;

    private Pageable pageable;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);
    }

    @Test
    void log_savesAuditEntry() {
        auditLogService.log("u1", "e1", "USER", "USER_CREATED", "desc", true, "old", "new", "127.0.0.1");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo("u1");
        assertThat(saved.getAction()).isEqualTo("USER_CREATED");
        assertThat(saved.isSuccess()).isTrue();
    }

    @Test
    void findAll_mapsToResponse() {
        AuditLog entry = AuditLog.builder().id("a1").userId("u1").action("LOGIN_SUCCESS").success(true).build();
        when(auditLogRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(entry)));

        var result = auditLogService.findAll(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo("a1");
    }

    @Test
    void findByUser_mapsToResponse() {
        AuditLog entry = AuditLog.builder().id("a1").userId("u1").build();
        when(auditLogRepository.findByUserId("u1", pageable)).thenReturn(new PageImpl<>(List.of(entry)));

        var result = auditLogService.findByUser("u1", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void findByAction_mapsToResponse() {
        when(auditLogRepository.findByAction("LOGIN_SUCCESS", pageable))
                .thenReturn(new PageImpl<>(List.of(AuditLog.builder().id("a1").action("LOGIN_SUCCESS").build())));

        var result = auditLogService.findByAction("LOGIN_SUCCESS", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void findBySuccess_mapsToResponse() {
        when(auditLogRepository.findBySuccess(false, pageable))
                .thenReturn(new PageImpl<>(List.of(AuditLog.builder().id("a1").success(false).build())));

        var result = auditLogService.findBySuccess(false, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).isSuccess()).isFalse();
    }

    @Test
    void findByEntityType_mapsToResponse() {
        when(auditLogRepository.findByEntityType("USER", pageable))
                .thenReturn(new PageImpl<>(List.of(AuditLog.builder().id("a1").entityType("USER").build())));

        var result = auditLogService.findByEntityType("USER", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void countTotal_delegatesToRepository() {
        when(auditLogRepository.count()).thenReturn(42L);
        assertThat(auditLogService.countTotal()).isEqualTo(42L);
    }

    @Test
    void countSuccess_delegatesToRepository() {
        when(auditLogRepository.countBySuccess(true)).thenReturn(10L);
        assertThat(auditLogService.countSuccess()).isEqualTo(10L);
    }

    @Test
    void countFailure_delegatesToRepository() {
        when(auditLogRepository.countBySuccess(false)).thenReturn(3L);
        assertThat(auditLogService.countFailure()).isEqualTo(3L);
    }

    @Test
    void getActivityStats_emptyLogs_returnsDefaults() {
        when(auditLogRepository.findByCreatedAtGreaterThanEqual(any(LocalDateTime.class)))
                .thenReturn(List.of());

        ActivityStatsResponse stats = auditLogService.getActivityStats();

        assertThat(stats.getActivityByHour()).hasSize(24);
        assertThat(stats.getLoginsPerDay()).hasSize(14);
        assertThat(stats.getTopActions()).isEmpty();
        assertThat(stats.getTotalEventsLast30Days()).isZero();
        assertThat(stats.getTotalLoginsLast30Days()).isZero();
    }

    @Test
    void getActivityStats_withLogins_countsCorrectly() {
        LocalDateTime now = LocalDateTime.now();
        AuditLog login1 = AuditLog.builder().id("1").action("LOGIN_SUCCESS").createdAt(now).build();
        AuditLog login2 = AuditLog.builder().id("2").action("LOGIN_SUCCESS").createdAt(now.minusHours(1)).build();
        AuditLog other = AuditLog.builder().id("3").action("PROFILE_UPDATE").createdAt(now).build();

        when(auditLogRepository.findByCreatedAtGreaterThanEqual(any(LocalDateTime.class)))
                .thenReturn(List.of(login1, login2, other));

        ActivityStatsResponse stats = auditLogService.getActivityStats();

        assertThat(stats.getTotalEventsLast30Days()).isEqualTo(3);
        assertThat(stats.getTotalLoginsLast30Days()).isEqualTo(2);
        assertThat(stats.getTopActions()).isNotEmpty();
    }

    @Test
    void getActivityStats_ignoresLogsWithNullCreatedAt() {
        AuditLog noDate = AuditLog.builder().id("1").action("LOGIN_SUCCESS").createdAt(null).build();

        when(auditLogRepository.findByCreatedAtGreaterThanEqual(any(LocalDateTime.class)))
                .thenReturn(List.of(noDate));

        ActivityStatsResponse stats = auditLogService.getActivityStats();

        // hourly bucket unaffected since createdAt is null (skipped)
        assertThat(stats.getActivityByHour()).allSatisfy(h -> assertThat(h.getCount()).isZero());
    }
}
