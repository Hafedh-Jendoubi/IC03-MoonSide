package tn.moonside.postservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import tn.moonside.postservice.event.NotificationEvent;
import tn.moonside.postservice.event.PostActivityEvent;

@Configuration
public class KafkaConfig {

    @Value("${kafka.topic.notifications:notifications-events}")
    private String notificationsTopic;

    @Value("${kafka.topic.post-activity:post-activity-events}")
    private String postActivityTopic;

    @Bean
    public NewTopic notificationsTopic() {
        return TopicBuilder.name(notificationsTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic postActivityTopic() {
        return TopicBuilder.name(postActivityTopic)
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
    public KafkaTemplate<String, PostActivityEvent> postActivityKafkaTemplate(
            ProducerFactory<String, PostActivityEvent> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }
}
