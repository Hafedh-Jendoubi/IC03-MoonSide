package tn.moonside.notificationservice.kafka;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.moonside.notificationservice.enums.NotificationType;
import tn.moonside.notificationservice.event.NotificationEvent;
import tn.moonside.notificationservice.service.NotificationService;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationKafkaConsumerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationKafkaConsumer notificationKafkaConsumer;

    @Test
    void consume_validEvent_delegatesToNotificationService() {
        NotificationEvent event = NotificationEvent.builder()
                .recipientId("user1")
                .senderId("user2")
                .notificationType(NotificationType.COMMENT)
                .build();

        notificationKafkaConsumer.consume(event);

        verify(notificationService).processEvent(event);
    }

    @Test
    void consume_serviceThrows_exceptionIsSwallowed() {
        NotificationEvent event = NotificationEvent.builder()
                .recipientId("user1")
                .senderId("user2")
                .notificationType(NotificationType.COMMENT)
                .build();

        doThrow(new RuntimeException("db down")).when(notificationService).processEvent(event);

        // Should not propagate: the consumer must not crash the Kafka listener thread.
        notificationKafkaConsumer.consume(event);

        verify(notificationService).processEvent(event);
    }
}
