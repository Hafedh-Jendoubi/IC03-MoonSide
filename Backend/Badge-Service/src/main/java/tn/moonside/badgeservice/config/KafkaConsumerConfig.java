package tn.moonside.badgeservice.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import tn.moonside.badgeservice.events.PostActivityEvent;
import tn.moonside.badgeservice.events.UserActivityEvent;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id:badge-service-group}")
    private String groupId;

    // ── UserActivityEvent consumer ─────────────────────────────────────────────

    @Bean
    public ConsumerFactory<String, UserActivityEvent> userActivityConsumerFactory() {
        JsonDeserializer<UserActivityEvent> deserializer =
                new JsonDeserializer<>(UserActivityEvent.class, false);
        deserializer.addTrustedPackages("*");

        Map<String, Object> props = baseProps();
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, UserActivityEvent>
    userActivityKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, UserActivityEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(userActivityConsumerFactory());
        return factory;
    }

    // ── PostActivityEvent consumer ─────────────────────────────────────────────

    @Bean
    public ConsumerFactory<String, PostActivityEvent> postActivityConsumerFactory() {
        JsonDeserializer<PostActivityEvent> deserializer =
                new JsonDeserializer<>(PostActivityEvent.class, false);
        deserializer.addTrustedPackages("*");

        Map<String, Object> props = baseProps();
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PostActivityEvent>
    postActivityKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, PostActivityEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(postActivityConsumerFactory());
        return factory;
    }

    // ── Shared base consumer properties ───────────────────────────────────────

    private Map<String, Object> baseProps() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        return props;
    }
}
