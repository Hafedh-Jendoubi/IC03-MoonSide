package tn.moonside.organizationservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.organizationservice.entities.Follow;
import tn.moonside.organizationservice.enums.FollowTargetType;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends MongoRepository<Follow, String> {

    Optional<Follow> findByUserIdAndTargetIdAndTargetType(String userId, String targetId, FollowTargetType targetType);

    boolean existsByUserIdAndTargetIdAndTargetType(String userId, String targetId, FollowTargetType targetType);

    long countByTargetIdAndTargetType(String targetId, FollowTargetType targetType);

    void deleteByUserIdAndTargetIdAndTargetType(String userId, String targetId, FollowTargetType targetType);

    List<Follow> findByUserIdAndTargetType(String userId, FollowTargetType targetType);

    List<Follow> findByUserId(String userId);

    List<Follow> findByTargetIdAndTargetType(String targetId, FollowTargetType targetType);
}
