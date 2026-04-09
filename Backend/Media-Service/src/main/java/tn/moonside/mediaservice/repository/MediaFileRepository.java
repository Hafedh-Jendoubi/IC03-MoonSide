package tn.moonside.mediaservice.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.mediaservice.entity.MediaFile;

import java.util.List;

public interface MediaFileRepository extends MongoRepository<MediaFile, String> {
    List<MediaFile> findByUploadedByOrderByUploadedAtDesc(String uploadedBy);
}
