package tn.moonside.badgeservice.kafka;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.moonside.badgeservice.events.PostActivityEvent;
import tn.moonside.badgeservice.services.BadgeService;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostActivityKafkaConsumerTest {

    @Mock
    private BadgeService badgeService;

    @InjectMocks
    private PostActivityKafkaConsumer postActivityKafkaConsumer;

    @Test
    void consume_withTotalPosts_delegatesWithIntValue() {
        PostActivityEvent event = PostActivityEvent.builder()
                .authorId("user1")
                .activityType("POST_CREATED")
                .totalPosts(42L)
                .build();

        postActivityKafkaConsumer.consume(event);

        verify(badgeService).evaluateAndAward("user1", "POST_CREATED", 42);
    }

    @Test
    void consume_nullTotalPosts_defaultsToZero() {
        PostActivityEvent event = PostActivityEvent.builder()
                .authorId("user1")
                .activityType("POST_CREATED")
                .totalPosts(null)
                .build();

        postActivityKafkaConsumer.consume(event);

        verify(badgeService).evaluateAndAward("user1", "POST_CREATED", 0);
    }

    @Test
    void consume_serviceThrows_exceptionIsSwallowed() {
        PostActivityEvent event = PostActivityEvent.builder()
                .authorId("user1")
                .activityType("POST_CREATED")
                .totalPosts(1L)
                .build();
        doThrow(new RuntimeException("db down")).when(badgeService)
                .evaluateAndAward("user1", "POST_CREATED", 1);

        // Should not propagate: the consumer must not crash the Kafka listener thread.
        postActivityKafkaConsumer.consume(event);

        verify(badgeService).evaluateAndAward("user1", "POST_CREATED", 1);
    }
}
