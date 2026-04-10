package tn.moonside.mediaservice.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.moonside.mediaservice.dto.MediaResponse;
import tn.moonside.mediaservice.entity.MediaFile;
import tn.moonside.mediaservice.exception.MediaNotFoundException;
import tn.moonside.mediaservice.exception.MediaUploadException;
import tn.moonside.mediaservice.repository.MediaFileRepository;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaServiceImpl implements MediaService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10 MB

    private final MinioClient minioClient;
    private final MediaFileRepository repository;

    @Value("${minio.bucket}")
    private String bucket;

    @Value("${minio.public-endpoint}")
    private String publicEndpoint;

    @Override
    public MediaResponse upload(MultipartFile file, String context, String uploaderEmail) {

        // ── Validate ──────────────────────────────────────────────────────────
        if (file == null || file.isEmpty()) {
            throw new MediaUploadException("File must not be empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new MediaUploadException("Unsupported file type. Allowed: " + ALLOWED_TYPES);
        }
        if (file.getSize() > MAX_SIZE) {
            throw new MediaUploadException("File exceeds the 10 MB limit");
        }

        // ── Build a unique object key ─────────────────────────────────────────
        String extension = extractExtension(file.getOriginalFilename(), contentType);
        String objectKey = context.toLowerCase() + "/" + UUID.randomUUID() + "." + extension;

        // ── Upload to MinIO ───────────────────────────────────────────────────
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(contentType)
                            .build()
            );
        } catch (Exception e) {
            log.error("MinIO upload failed for key {}: {}", objectKey, e.getMessage());
            throw new MediaUploadException("Failed to upload file to storage: " + e.getMessage());
        }

        // ── Persist metadata ──────────────────────────────────────────────────
        String url = publicEndpoint + "/" + bucket + "/" + objectKey;

        MediaFile mediaFile = MediaFile.builder()
                .uploadedBy(uploaderEmail)
                .originalFilename(file.getOriginalFilename())
                .contentType(contentType)
                .size(file.getSize())
                .objectKey(objectKey)
                .url(url)
                .context(context.toUpperCase())
                .build();

        MediaFile saved = repository.save(mediaFile);
        log.info("Uploaded media [{}] for user [{}]", saved.getId(), uploaderEmail);

        return toResponse(saved);
    }

    @Override
    public MediaResponse getById(String id) {
        MediaFile file = repository.findById(id)
                .orElseThrow(() -> new MediaNotFoundException("Media not found: " + id));
        return toResponse(file);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private MediaResponse toResponse(MediaFile f) {
        return MediaResponse.builder()
                .id(f.getId())
                .uploadedBy(f.getUploadedBy())
                .originalFilename(f.getOriginalFilename())
                .contentType(f.getContentType())
                .size(f.getSize())
                .url(f.getUrl())
                .context(f.getContext())
                .uploadedAt(f.getUploadedAt())
                .build();
    }

    private String extractExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        }
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png"  -> "png";
            case "image/gif"  -> "gif";
            case "image/webp" -> "webp";
            default           -> "bin";
        };
    }
}
