package tn.moonside.mediaservice.service;

import org.springframework.web.multipart.MultipartFile;
import tn.moonside.mediaservice.dto.MediaResponse;

public interface MediaService {

    /**
     * Upload a file to MinIO, save metadata to MongoDB, and return the result.
     *
     * @param file      the multipart file
     * @param context   logical context: AVATAR, POST_ATTACHMENT, etc.
     * @param uploaderEmail  email extracted from the JWT
     */
    MediaResponse upload(MultipartFile file, String context, String uploaderEmail);

    /**
     * Retrieve metadata for a previously uploaded file.
     */
    MediaResponse getById(String id);
}
