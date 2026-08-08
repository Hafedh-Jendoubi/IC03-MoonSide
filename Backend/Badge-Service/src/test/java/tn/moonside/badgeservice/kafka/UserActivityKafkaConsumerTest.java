package tn.moonside.badgeservice.kafka;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.moonside.badgeservice.events.UserActivityEvent;
import tn.moonside.badgeservice.services.BadgeService;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserActivityKafkaConsumerTest {

    @Mock
    private BadgeService badgeService;

    @InjectMocks
    private UserActivityKafkaConsumer userActivityKafkaConsumer;

    @Test
    void consume_withValue_delegatesToBadgeService() {
        UserActivityEvent event = UserActivityEvent.builder()
                .userId("user1")
                .activityType("CONNECTION_ACCEPTED")
                .value(5)
                .build();

        userActivityKafkaConsumer.consume(event);

        verify(badgeService).evaluateAndAward("user1", "CONNECTION_ACCEPTED", 5);
    }

    @Test
    void consume_nullValue_defaultsToZero() {
        UserActivityEvent event = UserActivityEvent.builder()
                .userId("user1")
                .activityType("PROFILE_COMPLETED")
                .value(null)
                .build();

        userActivityKafkaConsumer.consume(event);

        verify(badgeService).evaluateAndAward("user1", "PROFILE_COMPLETED", 0);
    }

    @Test
    void consume_serviceThrows_exceptionIsSwallowed() {
        UserActivityEvent event = UserActivityEvent.builder()
                .userId("user1")
                .activityType("LOGIN_STREAK")
                .value(3)
                .build();
        doThrow(new RuntimeException("db down")).when(badgeService)
                .evaluateAndAward("user1", "LOGIN_STREAK", 3);

        // Should not propagate: the consumer must not crash the Kafka listener thread.
        userActivityKafkaConsumer.consume(event);

        verify(badgeService).evaluateAndAward("user1", "LOGIN_STREAK", 3);
    }
}
