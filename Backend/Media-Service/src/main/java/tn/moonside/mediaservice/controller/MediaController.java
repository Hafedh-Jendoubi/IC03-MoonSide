package tn.moonside.mediaservice.controller;

import io.minio.GetObjectArgs;
import io.minio.GetObjectResponse;
import io.minio.MinioClient;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.InputStreamResource;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.moonside.mediaservice.dto.ApiResponse;
import tn.moonside.mediaservice.dto.MediaResponse;
import tn.moonside.mediaservice.exception.MediaNotFoundException;
import tn.moonside.mediaservice.service.MediaService;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
@Slf4j
public class MediaController {

    private final MediaService mediaService;
    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    /**
     * Upload a file.
     *
     * Accepts multipart/form-data with:
     *   - file    : the binary file
     *   - context : logical context string (e.g. AVATAR, POST_ATTACHMENT)
     *
     * Returns the saved metadata including the public URL.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MediaResponse>> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "context", defaultValue = "GENERAL") String context,
            @AuthenticationPrincipal String uploaderEmail) {

        MediaResponse response = mediaService.upload(file, context, uploaderEmail);
        return ResponseEntity.ok(ApiResponse.success(response, "File uploaded successfully"));
    }

    /**
     * Fetch metadata for an uploaded file by its ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MediaResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(mediaService.getById(id)));
    }

    /**
     * Streams a file straight from the (private) B2 bucket.
     *
     * The bucket itself is never public — this endpoint fetches the object
     * server-side with our stored credentials and relays the bytes to the
     * caller, so the URLs we hand out (see MediaServiceImpl) work exactly
     * like a public link would, without needing a public bucket.
     *
     * Matches everything after "/media/file/", including slashes, since our
     * object keys look like "avatar/<uuid>.png".
     */
    @GetMapping("/file/**")
    public ResponseEntity<InputStreamResource> streamFile(HttpServletRequest request) {
        String objectKey = request.getRequestURI().substring(
                request.getRequestURI().indexOf("/file/") + "/file/".length());

        if (objectKey.isBlank()) {
            throw new MediaNotFoundException("No file key provided");
        }

        try {
            GetObjectResponse object = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .build());

            String contentType = object.headers().get("Content-Type");

            return ResponseEntity.ok()
                    .contentType(contentType != null
                            ? MediaType.parseMediaType(contentType)
                            : MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                    .body(new InputStreamResource(object));
        } catch (Exception e) {
            log.warn("Failed to stream object [{}]: {}", objectKey, e.getMessage());
            throw new MediaNotFoundException("File not found: " + objectKey);
        }
    }
}
