package tn.moonside.postservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.postservice.entities.ReactionType;

import java.util.Optional;

public interface ReactionTypeRepository extends MongoRepository<ReactionType, String> {
    Optional<ReactionType> findByCode(String code);
    boolean existsByCode(String code);
}
