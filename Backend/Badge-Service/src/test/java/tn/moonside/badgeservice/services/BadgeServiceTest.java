package tn.moonside.badgeservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;
import tn.moonside.badgeservice.dtos.BadgeDefinitionResponse;
import tn.moonside.badgeservice.dtos.UserBadgeResponse;
import tn.moonside.badgeservice.entities.UserBadge;
import tn.moonside.badgeservice.enums.BadgeType;
import tn.moonside.badgeservice.events.NotificationEvent;
import tn.moonside.badgeservice.repositories.UserBadgeRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BadgeServiceTest {

    @Mock
    private UserBadgeRepository userBadgeRepository;

    @Mock
    private KafkaTemplate<String, NotificationEvent> notificationKafkaTemplate;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private BadgeService badgeService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(badgeService, "notificationsTopic", "notifications-events");
        ReflectionTestUtils.setField(badgeService, "userServiceUrl", "http://user-service");
    }

    // ── evaluateAndAward ─────────────────────────────────────────────────────

    @Test
    void evaluateAndAward_booleanTriggerBadge_awardsWhenNotAlreadyEarned() {
        when(userBadgeRepository.existsByUserIdAndBadgeType("user1", BadgeType.PROFILE_COMPLETED)).thenReturn(false);
        when(userBadgeRepository.save(any(UserBadge.class))).thenAnswer(inv -> inv.getArgument(0));

        badgeService.evaluateAndAward("user1", "PROFILE_COMPLETED", 0);

        ArgumentCaptor<UserBadge> captor = ArgumentCaptor.forClass(UserBadge.class);
        verify(userBadgeRepository).save(captor.capture());
        assertThat(captor.getValue().getBadgeType()).isEqualTo(BadgeType.PROFILE_COMPLETED);
        assertThat(captor.getValue().getUserId()).isEqualTo("user1");

        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(notificationKafkaTemplate).send(eq("notifications-events"), eq("user1"), eventCaptor.capture());
        assertThat(eventCaptor.getValue().getResourceId()).isEqualTo("PROFILE_COMPLETED");
        assertThat(eventCaptor.getValue().getNotificationType()).isEqualTo("BADGE_EARNED");
    }

    @Test
    void evaluateAndAward_thresholdMet_awardsOnlyMatchingBadge() {
        when(userBadgeRepository.existsByUserIdAndBadgeType("user1", BadgeType.FIRST_POST)).thenReturn(false);
        when(userBadgeRepository.save(any(UserBadge.class))).thenAnswer(inv -> inv.getArgument(0));

        badgeService.evaluateAndAward("user1", "POST_CREATED", 1);

        verify(userBadgeRepository, times(1)).save(any(UserBadge.class));
        verify(userBadgeRepository).existsByUserIdAndBadgeType("user1", BadgeType.FIRST_POST);
        verify(userBadgeRepository, never()).existsByUserIdAndBadgeType("user1", BadgeType.POSTS_10);
    }

    @Test
    void evaluateAndAward_belowThreshold_awardsNothing() {
        badgeService.evaluateAndAward("user1", "POST_CREATED", 0);

        verify(userBadgeRepository, never()).save(any());
        verify(userBadgeRepository, never()).existsByUserIdAndBadgeType(any(), any());
        verifyNoInteractions(notificationKafkaTemplate);
    }

    @Test
    void evaluateAndAward_multipleThresholdsMet_awardsAllQualifyingBadges() {
        when(userBadgeRepository.existsByUserIdAndBadgeType(eq("user1"), any(BadgeType.class))).thenReturn(false);
        when(userBadgeRepository.save(any(UserBadge.class))).thenAnswer(inv -> inv.getArgument(0));

        badgeService.evaluateAndAward("user1", "POST_CREATED", 15);

        // FIRST_POST (threshold 1) and POSTS_10 (threshold 10) both qualify at value=15.
        verify(userBadgeRepository, times(2)).save(any(UserBadge.class));
        verify(notificationKafkaTemplate, times(2)).send(eq("notifications-events"), eq("user1"), any(NotificationEvent.class));
    }

    @Test
    void evaluateAndAward_alreadyAwarded_doesNotSaveAgain() {
        when(userBadgeRepository.existsByUserIdAndBadgeType("user1", BadgeType.PROFILE_COMPLETED)).thenReturn(true);

        badgeService.evaluateAndAward("user1", "PROFILE_COMPLETED", 0);

        verify(userBadgeRepository, never()).save(any());
        verifyNoInteractions(notificationKafkaTemplate);
    }

    @Test
    void evaluateAndAward_noMatchingActivityType_doesNothing() {
        badgeService.evaluateAndAward("user1", "SOME_UNKNOWN_ACTIVITY", 999);

        verify(userBadgeRepository, never()).save(any());
        verify(userBadgeRepository, never()).existsByUserIdAndBadgeType(any(), any());
        verifyNoInteractions(notificationKafkaTemplate);
    }

    @Test
    void evaluateAndAward_saveThrows_doesNotPublishNotificationAndDoesNotPropagate() {
        when(userBadgeRepository.existsByUserIdAndBadgeType("user1", BadgeType.PROFILE_COMPLETED)).thenReturn(false);
        when(userBadgeRepository.save(any(UserBadge.class))).thenThrow(new RuntimeException("duplicate key"));

        badgeService.evaluateAndAward("user1", "PROFILE_COMPLETED", 0);

        verifyNoInteractions(notificationKafkaTemplate);
    }

    // ── getEarnedBadges ──────────────────────────────────────────────────────

    @Test
    void getEarnedBadges_returnsBadgesSortedByAwardedAtAscending() {
        UserBadge older = UserBadge.builder().id("b1").userId("user1").badgeType(BadgeType.PROFILE_COMPLETED)
                .awardedAt(LocalDateTime.of(2026, 1, 1, 0, 0)).build();
        UserBadge newer = UserBadge.builder().id("b2").userId("user1").badgeType(BadgeType.FIRST_POST)
                .awardedAt(LocalDateTime.of(2026, 2, 1, 0, 0)).build();
        when(userBadgeRepository.findByUserId("user1")).thenReturn(List.of(newer, older));

        List<UserBadgeResponse> result = badgeService.getEarnedBadges("user1");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getBadgeKey()).isEqualTo("PROFILE_COMPLETED");
        assertThat(result.get(1).getBadgeKey()).isEqualTo("FIRST_POST");
    }

    @Test
    void getEarnedBadges_noBadges_returnsEmptyList() {
        when(userBadgeRepository.findByUserId("user1")).thenReturn(List.of());

        List<UserBadgeResponse> result = badgeService.getEarnedBadges("user1");

        assertThat(result).isEmpty();
    }

    // ── getAllBadgeDefinitions ───────────────────────────────────────────────

    @Test
    void getAllBadgeDefinitions_marksEarnedBadgesCorrectly() {
        UserBadge earnedBadge = UserBadge.builder().id("b1").userId("user1").badgeType(BadgeType.FIRST_POST).build();
        when(userBadgeRepository.findByUserId("user1")).thenReturn(List.of(earnedBadge));

        List<BadgeDefinitionResponse> result = badgeService.getAllBadgeDefinitions("user1");

        assertThat(result).hasSize(BadgeType.values().length);
        BadgeDefinitionResponse firstPost = result.stream()
                .filter(r -> r.getKey().equals("FIRST_POST")).findFirst().orElseThrow();
        assertThat(firstPost.isEarned()).isTrue();

        BadgeDefinitionResponse unearned = result.stream()
                .filter(r -> r.getKey().equals("POSTS_10000")).findFirst().orElseThrow();
        assertThat(unearned.isEarned()).isFalse();
    }

    // ── getAllBadgesWithHolders ──────────────────────────────────────────────

    @Test
    void getAllBadgesWithHolders_returnsOneEntryPerBadgeType() {
        when(userBadgeRepository.findByBadgeTypeOrderByAwardedAtAsc(any(BadgeType.class))).thenReturn(List.of());

        List<BadgeDefinitionResponse> result = badgeService.getAllBadgesWithHolders();

        assertThat(result).hasSize(BadgeType.values().length);
        assertThat(result).allMatch(r -> !r.isEarned()); // public page: no user context
    }

    @Test
    void getAllBadgesWithHolders_fetchesHolderInfoFromUserService() {
        UserBadge holder = UserBadge.builder().id("b1").userId("user1").badgeType(BadgeType.FIRST_POST)
                .awardedAt(LocalDateTime.now()).build();
        when(userBadgeRepository.findByBadgeTypeOrderByAwardedAtAsc(BadgeType.FIRST_POST)).thenReturn(List.of(holder));
        when(userBadgeRepository.findByBadgeTypeOrderByAwardedAtAsc(argThat(bt -> bt != BadgeType.FIRST_POST)))
                .thenReturn(List.of());

        Map<String, Object> data = Map.of("firstName", "Jane", "lastName", "Doe", "avatar", "a.png", "jobTitle", "Engineer");
        Map<String, Object> body = Map.of("data", data);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        List<BadgeDefinitionResponse> result = badgeService.getAllBadgesWithHolders();

        BadgeDefinitionResponse firstPost = result.stream()
                .filter(r -> r.getKey().equals("FIRST_POST")).findFirst().orElseThrow();
        assertThat(firstPost.getHolderCount()).isEqualTo(1);
        assertThat(firstPost.getHolders().get(0).getFirstName()).isEqualTo("Jane");
        assertThat(firstPost.getHolders().get(0).getLastName()).isEqualTo("Doe");
    }

    @Test
    void getAllBadgesWithHolders_restTemplateFails_holderStillIncludedWithNullFields() {
        UserBadge holder = UserBadge.builder().id("b1").userId("user1").badgeType(BadgeType.FIRST_POST)
                .awardedAt(LocalDateTime.now()).build();
        when(userBadgeRepository.findByBadgeTypeOrderByAwardedAtAsc(BadgeType.FIRST_POST)).thenReturn(List.of(holder));
        when(userBadgeRepository.findByBadgeTypeOrderByAwardedAtAsc(argThat(bt -> bt != BadgeType.FIRST_POST)))
                .thenReturn(List.of());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("connection refused"));

        List<BadgeDefinitionResponse> result = badgeService.getAllBadgesWithHolders();

        BadgeDefinitionResponse firstPost = result.stream()
                .filter(r -> r.getKey().equals("FIRST_POST")).findFirst().orElseThrow();
        assertThat(firstPost.getHolderCount()).isEqualTo(1);
        assertThat(firstPost.getHolders().get(0).getUserId()).isEqualTo("user1");
        assertThat(firstPost.getHolders().get(0).getFirstName()).isNull();
    }
}
