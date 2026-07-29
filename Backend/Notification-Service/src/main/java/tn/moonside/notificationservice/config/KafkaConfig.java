package tn.moonside.notificationservice.config;

import org.springframework.context.annotation.Configuration;

/**
 * NOTE: Topic auto-creation via a NewTopic bean was removed.
 * On startup, Spring's KafkaAdmin uses any NewTopic bean to call the
 * broker's admin API and create/verify the topic. Against Aiven this
 * admin call was failing (permissions/replication-factor mismatch),
 * which crashed the whole ApplicationContext before the app could
 * even start (post-service never hit this because it has no NewTopic
 * bean). The "notifications-events" topic already exists — it's
 * created and used by post-service — so notification-service just
 * needs to consume/produce to it, not manage it.
 */
@Configuration
public class KafkaConfig {
}
