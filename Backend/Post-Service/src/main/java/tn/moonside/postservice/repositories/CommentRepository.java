package tn.moonside.postservice.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.postservice.entities.Comment;

import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {
    Page<Comment> findByPostIdAndParentIdIsNull(String postId, Pageable pageable);
    List<Comment> findByParentId(String parentId);
    long countByPostId(String postId);
    void deleteByPostId(String postId);
}
