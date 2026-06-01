package tn.moonside.postservice.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import tn.moonside.postservice.entities.Comment;

import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {
    Page<Comment> findByPostIdAndParentIdIsNull(String postId, Pageable pageable);

    /** Paginated replies — used by the getReplies endpoint. */
    Page<Comment> findByParentId(String parentId, Pageable pageable);

    /** All replies without pagination — used internally for recursive deletion. */
    @Query("{ 'parentId': ?0 }")
    List<Comment> findAllReplies(String parentId);

    /** Efficient reply count for toResponse(). */
    long countByParentId(String parentId);

    long countByPostId(String postId);
    void deleteByPostId(String postId);
}
