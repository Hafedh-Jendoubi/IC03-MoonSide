package tn.moonside.postservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.postservice.entities.SavedPost;

import java.util.List;
import java.util.Optional;

public interface SavedPostRepository extends MongoRepository<SavedPost, String> {
    List<SavedPost> findByUserId(String userId);
    Optional<SavedPost> findByUserIdAndPostId(String userId, String postId);
    boolean existsByUserIdAndPostId(String userId, String postId);
    void deleteByUserIdAndPostId(String userId, String postId);
}
