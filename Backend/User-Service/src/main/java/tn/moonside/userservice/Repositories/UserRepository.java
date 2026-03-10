package tn.moonside.userservice.Repositories;

import tn.moonside.userservice.Entities.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUserId(UUID userId);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUserId(UUID userId);
}
