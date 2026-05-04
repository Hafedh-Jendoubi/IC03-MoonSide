package tn.moonside.postservice.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.enums.VisibilityType;

import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
    Page<Post> findByPostVisibilityIn(List<VisibilityType> visibilities, Pageable pageable);
    Page<Post> findByAuthorId(String authorId, Pageable pageable);
    Page<Post> findByTeamId(String teamId, Pageable pageable);
    Page<Post> findByDepartmentId(String departmentId, Pageable pageable);
    Page<Post> findByTeamIdAndPostVisibilityIn(String teamId, List<VisibilityType> visibilities, Pageable pageable);
    Page<Post> findByDepartmentIdAndPostVisibilityIn(String departmentId, List<VisibilityType> visibilities, Pageable pageable);
}
