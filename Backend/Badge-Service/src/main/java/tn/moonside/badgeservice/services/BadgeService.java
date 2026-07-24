package tn.moonside.badgeservice.services;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import tn.moonside.badgeservice.dtos.BadgeDefinitionResponse;
import tn.moonside.badgeservice.dtos.UserBadgeResponse;
import tn.moonside.badgeservice.entities.UserBadge;
import tn.moonside.badgeservice.enums.BadgeType;
import tn.moonside.badgeservice.events.NotificationEvent;
import tn.moonside.badgeservice.repositories.UserBadgeRepository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class BadgeService {

    private final UserBadgeRepository userBadgeRepository;
    private final KafkaTemplate<String, NotificationEvent> notificationKafkaTemplate;
    private final RestTemplate restTemplate;

    @Value("${kafka.topic.notifications:notifications-events}")
    private String notificationsTopic;

    @Value("${services.user-service.url}")
    private String userServiceUrl;

    // ── Badge award engine ────────────────────────────────────────────────────

    /**
     * Checks whether the user should receive any of the badges whose
     * triggerActivity matches {@code activityType}, and awards those not yet held.
     *
     * @param userId       the user to check
     * @param activityType e.g. "POST_CREATED", "CONNECTION_ACCEPTED", "LOGIN_STREAK"
     * @param value        numeric payload from the event (post count, connection count, streak days)
     */
    public void evaluateAndAward(String userId, String activityType, int value) {
        for (BadgeType badge : BadgeType.values()) {
            if (!badge.getTriggerActivity().equals(activityType)) continue;

            boolean shouldAward = badge.getThreshold() == 0
                    ? true                       // boolean trigger: any event of this type
                    : value >= badge.getThreshold();

            if (!shouldAward) continue;
            if (userBadgeRepository.existsByUserIdAndBadgeType(userId, badge)) continue;

            try {
                UserBadge awarded = userBadgeRepository.save(
                        UserBadge.builder()
                                .userId(userId)
                                .badgeType(badge)
                                .awardedAt(LocalDateTime.now())
                                .build());
                log.info("Badge awarded: {} → user {}", badge.name(), userId);
                publishBadgeNotification(userId, badge);
            } catch (Exception e) {
                // Duplicate key exception from race condition: safe to ignore
                log.debug("Badge {} already awarded to user {} (concurrent award): {}", badge.name(), userId, e.getMessage());
            }
        }
    }

    // ── Notification publishing ───────────────────────────────────────────────

    private void publishBadgeNotification(String userId, BadgeType badge) {
        try {
            NotificationEvent event = NotificationEvent.builder()
                    .recipientId(userId)
                    .senderId(null)
                    .notificationType("BADGE_EARNED")
                    .title("🏆 You earned the \"" + badge.getDisplayName() + "\" badge!")
                    .body(badge.getDescription())
                    .resourceId(badge.name())
                    .resourceType("BADGE")
                    .build();
            notificationKafkaTemplate.send(notificationsTopic, userId, event);
        } catch (Exception e) {
            log.error("Failed to publish badge notification for user {}: {}", userId, e.getMessage());
        }
    }

    // ── REST query layer ──────────────────────────────────────────────────────

    /** All badges a specific user has earned. */
    public List<UserBadgeResponse> getEarnedBadges(String userId) {
        return userBadgeRepository.findByUserId(userId).stream()
                .map(ub -> toUserBadgeResponse(ub, userId))
                .sorted(Comparator.comparing(UserBadgeResponse::getAwardedAt))
                .collect(Collectors.toList());
    }

    /** Full catalogue of all badge definitions (earned + unearned) for a given user. */
    public List<BadgeDefinitionResponse> getAllBadgeDefinitions(String userId) {
        Set<BadgeType> earned = userBadgeRepository.findByUserId(userId).stream()
                .map(UserBadge::getBadgeType)
                .collect(Collectors.toSet());

        return Stream.of(BadgeType.values())
                .map(bt -> BadgeDefinitionResponse.builder()
                        .key(bt.name())
                        .displayName(bt.getDisplayName())
                        .description(bt.getDescription())
                        .icon(bt.getIcon())
                        .category(bt.getCategory().name())
                        .earned(earned.contains(bt))
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * All badge definitions with the list of users who have earned each one.
     * Used to populate the public /badges page.
     */
    public List<BadgeDefinitionResponse> getAllBadgesWithHolders() {
        return Stream.of(BadgeType.values())
                .map(bt -> {
                    List<UserBadge> holders = userBadgeRepository.findByBadgeTypeOrderByAwardedAtAsc(bt);
                    List<BadgeDefinitionResponse.HolderSummary> holderSummaries = holders.stream()
                            .map(ub -> {
                                UserInfo info = fetchUserInfo(ub.getUserId());
                                return BadgeDefinitionResponse.HolderSummary.builder()
                                        .userId(ub.getUserId())
                                        .firstName(info.firstName())
                                        .lastName(info.lastName())
                                        .avatar(info.avatar())
                                        .jobTitle(info.jobTitle())
                                        .awardedAt(ub.getAwardedAt())
                                        .build();
                            })
                            .collect(Collectors.toList());

                    return BadgeDefinitionResponse.builder()
                            .key(bt.name())
                            .displayName(bt.getDisplayName())
                            .description(bt.getDescription())
                            .icon(bt.getIcon())
                            .category(bt.getCategory().name())
                            .earned(false) // public page, no user context
                            .holders(holderSummaries)
                            .holderCount(holderSummaries.size())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private UserInfo fetchUserInfo(String userId) {
        try {
            HttpHeaders headers = buildHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> resp = restTemplate.exchange(
                    userServiceUrl + "/users/internal/" + userId,
                    HttpMethod.GET,
                    entity,
                    Map.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                return new UserInfo(userId, null, null, null, null);
            }

            Map<String, Object> body = resp.getBody();
            Map<String, Object> data = (Map<String, Object>) body.get("data");
            if (data == null) return new UserInfo(userId, null, null, null, null);
            return new UserInfo(
                    userId,
                    str(data, "firstName"),
                    str(data, "lastName"),
                    str(data, "avatar"),
                    str(data, "jobTitle"));
        } catch (Exception e) {
            log.warn("Could not fetch user info for {}: {}", userId, e.getMessage());
            return new UserInfo(userId, null, null, null, null);
        }
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
            String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (auth != null && auth.startsWith("Bearer ")) {
                return auth.substring(7);
            }
        } catch (Exception e) {
            log.debug("Could not extract bearer token: {}", e.getMessage());
        }
        return null;
    }

    private String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v == null ? null : v.toString();
    }

    private UserBadgeResponse toUserBadgeResponse(UserBadge ub, String userId) {
        BadgeType bt = ub.getBadgeType();
        return UserBadgeResponse.builder()
                .id(ub.getId())
                .userId(userId)
                .badgeKey(bt.name())
                .displayName(bt.getDisplayName())
                .description(bt.getDescription())
                .icon(bt.getIcon())
                .category(bt.getCategory().name())
                .awardedAt(ub.getAwardedAt())
                .build();
    }

    private record UserInfo(String id, String firstName, String lastName, String avatar, String jobTitle) {}
}
