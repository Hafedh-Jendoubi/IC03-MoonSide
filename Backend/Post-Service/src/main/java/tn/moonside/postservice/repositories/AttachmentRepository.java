package tn.moonside.postservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.postservice.entities.Attachment;

import java.util.List;

public interface AttachmentRepository extends MongoRepository<Attachment, String> {
    List<Attachment> findByPostId(String postId);
    void deleteByPostId(String postId);
}
