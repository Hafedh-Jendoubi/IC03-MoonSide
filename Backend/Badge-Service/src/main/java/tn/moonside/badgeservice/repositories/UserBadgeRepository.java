package tn.moonside.badgeservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.badgeservice.entities.UserBadge;
import tn.moonside.badgeservice.enums.BadgeType;

import java.util.List;
import java.util.Optional;

public interface UserBadgeRepository extends MongoRepository<UserBadge, String> {

    List<UserBadge> findByUserId(String userId);

    boolean existsByUserIdAndBadgeType(String userId, BadgeType badgeType);

    Optional<UserBadge> findByUserIdAndBadgeType(String userId, BadgeType badgeType);

    /** All holders of a specific badge, for the "who has this badge" list on the badges page. */
    List<UserBadge> findByBadgeTypeOrderByAwardedAtAsc(BadgeType badgeType);

    long countByUserId(String userId);
}
