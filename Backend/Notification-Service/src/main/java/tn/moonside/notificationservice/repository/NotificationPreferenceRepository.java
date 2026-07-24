package tn.moonside.notificationservice.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.notificationservice.entity.NotificationPreference;

import java.util.Optional;

public interface NotificationPreferenceRepository extends MongoRepository<NotificationPreference, String> {

    Optional<NotificationPreference> findByUserId(String userId);
}
