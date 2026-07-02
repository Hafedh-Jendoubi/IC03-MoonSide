package tn.moonside.userservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import tn.moonside.userservice.event.NotificationEvent;
import tn.moonside.userservice.event.UserActivityEvent;

@Configuration
public class KafkaConfig {

    @Value("${kafka.topic.notifications:notifications-events}")
    private String notificationsTopic;

    @Value("${kafka.topic.user-activity:user-activity-events}")
    private String userActivityTopic;

    @Bean
    public NewTopic notificationsTopic() {
        return TopicBuilder.name(notificationsTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic userActivityTopic() {
        return TopicBuilder.name(userActivityTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public KafkaTemplate<String, NotificationEvent> notificationKafkaTemplate(
            ProducerFactory<String, NotificationEvent> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }

    @Bean
    public KafkaTemplate<String, UserActivityEvent> userActivityKafkaTemplate(
            ProducerFactory<String, UserActivityEvent> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }
}
