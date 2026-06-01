package tn.moonside.postservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.postservice.entities.Reaction;

import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends MongoRepository<Reaction, String> {
    Optional<Reaction> findByUserIdAndReactableTypeAndReactableId(
            String userId, String reactableType, String reactableId);
    List<Reaction> findByReactableTypeAndReactableId(String reactableType, String reactableId);
    long countByReactableTypeAndReactableId(String reactableType, String reactableId);
    boolean existsByUserIdAndReactableTypeAndReactableId(
            String userId, String reactableType, String reactableId);
    void deleteByReactableTypeAndReactableId(String reactableType, String reactableId);
}
