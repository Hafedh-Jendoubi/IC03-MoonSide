package tn.moonside.postservice.services;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.moonside.postservice.dtos.responses.AttachmentResponse;
import tn.moonside.postservice.entities.Attachment;
import tn.moonside.postservice.enums.AttachmentType;
import tn.moonside.postservice.repositories.AttachmentRepository;
import tn.moonside.postservice.repositories.PostRepository;

import java.io.InputStream;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Handles uploading, retrieving, and deleting post attachments in MinIO.
 *
 * Upload strategy (minio-java 8.x public API only):
 *  - Files <= 50 MB : PutObjectArgs with partSize=-1  -> SDK does a single PUT
 *  - Files >  50 MB : PutObjectArgs with partSize=10MB -> SDK activates its
 *    internal S3 multipart path, uploading 10 MB chunks automatically.
 *    No internal *Args classes are used.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PostAttachmentService {

    static final long SIMPLE_UPLOAD_THRESHOLD_BYTES = 50L * 1024 * 1024;  // 50 MB
    static final long PART_SIZE_BYTES               = 10L * 1024 * 1024;  // 10 MB chunks
    static final long MAX_FILE_SIZE_BYTES           = 500L * 1024 * 1024; // 500 MB cap
    static final int  MAX_ATTACHMENTS_PER_POST      = 10;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "image/svg+xml", "image/bmp", "image/tiff",
            "video/mp4", "video/webm", "video/ogg", "video/quicktime",
            "video/x-msvideo", "video/x-matroska",
            "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm",
            "audio/aac", "audio/flac",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/msword",
            "application/vnd.ms-excel",
            "application/vnd.ms-powerpoint",
            "application/vnd.oasis.opendocument.text",
            "application/vnd.oasis.opendocument.spreadsheet",
            "application/vnd.oasis.opendocument.presentation",
            "text/plain", "text/csv", "text/markdown",
            "application/zip",
            "application/x-rar-compressed",
            "application/x-7z-compressed"
    );

    private final MinioClient minioClient;
    private final AttachmentRepository attachmentRepository;
    private final PostRepository postRepository;

    @Value("${minio.bucket}")
    private String bucket;

    @Value("${minio.public-endpoint}")
    private String publicEndpoint;

    // ── Public API ────────────────────────────────────────────────────────────

    public AttachmentResponse uploadAttachment(String postId,
                                               MultipartFile file,
                                               String uploaderId) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("Post not found: " + postId);
        }
        long existingCount = attachmentRepository.countByPostId(postId);
        if (existingCount >= MAX_ATTACHMENTS_PER_POST) {
            throw new IllegalStateException(
                    "A post may have at most " + MAX_ATTACHMENTS_PER_POST + " attachments.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty.");
        }
        String contentType = resolveContentType(file);
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Unsupported file type [" + contentType + "].");
        }
        long fileSize = file.getSize();
        if (fileSize > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException(
                    "File exceeds the 500 MB maximum (" + (fileSize / 1_048_576) + " MB received).");
        }

        String extension = extractExtension(file.getOriginalFilename(), contentType);
        String objectKey = "post-attachments/" + postId + "/" + UUID.randomUUID() + "." + extension;

        uploadToMinio(file, objectKey, contentType, fileSize);

        String fileURL = publicEndpoint + "/" + bucket + "/" + objectKey;
        Attachment saved = attachmentRepository.save(
                Attachment.builder()
                        .postId(postId)
                        .uploaderId(uploaderId)
                        .fileName(file.getOriginalFilename())
                        .fileURL(fileURL)
                        .fileSizeBytes(fileSize)
                        .contentType(contentType)
                        .attachmentType(classifyContentType(contentType))
                        .objectKey(objectKey)
                        .build()
        );
        log.info("Attachment [{}] ({} MB, {}) saved for post [{}] by user [{}]",
                saved.getId(), fileSize / 1_048_576, contentType, postId, uploaderId);
        return toResponse(saved);
    }

    public List<AttachmentResponse> getByPost(String postId) {
        return attachmentRepository.findByPostId(postId).stream().map(this::toResponse).toList();
    }

    public void deleteAttachment(String attachmentId, String requesterId) {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found: " + attachmentId));
        if (!a.getUploaderId().equals(requesterId)) {
            throw new AccessDeniedException("Not allowed to delete this attachment.");
        }
        deleteFromMinio(a.getObjectKey());
        attachmentRepository.delete(a);
        log.info("Attachment [{}] deleted by user [{}]", attachmentId, requesterId);
    }

    public void deleteAllForPost(String postId) {
        List<Attachment> attachments = attachmentRepository.findByPostId(postId);
        attachments.forEach(a -> deleteFromMinio(a.getObjectKey()));
        attachmentRepository.deleteAll(attachments);
        log.info("Deleted {} attachment(s) for post [{}]", attachments.size(), postId);
    }

    // ── MinIO helpers ─────────────────────────────────────────────────────────

    /**
     * Uploads to MinIO using only the public minio-java 8.x PutObjectArgs API.
     *
     * The third argument to .stream() is partSize:
     *   -1            → SDK selects strategy (single PUT for small files)
     *   PART_SIZE_BYTES → SDK performs S3 multipart upload automatically
     *
     * This means we never need to call createMultipartUpload / uploadPart /
     * completeMultipartUpload directly — the SDK handles all of that internally.
     */
    private void uploadToMinio(MultipartFile file, String objectKey,
                                String contentType, long fileSize) {
        long partSize = fileSize > SIMPLE_UPLOAD_THRESHOLD_BYTES ? PART_SIZE_BYTES : -1;
        try (InputStream is = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .stream(is, fileSize, partSize)
                            .contentType(contentType)
                            .build()
            );
            log.debug("Uploaded [{}] ({} MB) partSize={}", objectKey, fileSize / 1_048_576, partSize);
        } catch (Exception e) {
            log.error("MinIO upload failed [{}]: {}", objectKey, e.getMessage());
            throw new RuntimeException("Failed to upload file to storage: " + e.getMessage(), e);
        }
    }

    private void deleteFromMinio(String objectKey) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
        } catch (Exception e) {
            log.warn("MinIO delete failed for key [{}]: {}", objectKey, e.getMessage());
        }
    }

    // ── Classification ────────────────────────────────────────────────────────

    private AttachmentType classifyContentType(String contentType) {
        if (contentType.startsWith("image/"))                           return AttachmentType.IMAGE;
        if (contentType.startsWith("video/"))                           return AttachmentType.VIDEO;
        if (contentType.startsWith("audio/"))                           return AttachmentType.AUDIO;
        if (contentType.startsWith("application/") || contentType.startsWith("text/"))
                                                                        return AttachmentType.DOCUMENT;
        return AttachmentType.OTHER;
    }

    private String resolveContentType(MultipartFile file) {
        String ct = file.getContentType();
        if (ct == null || ct.isBlank() || "application/octet-stream".equals(ct)) {
            String name = file.getOriginalFilename();
            if (name != null) ct = extensionToMime(name.toLowerCase());
        }
        return ct != null ? ct : "application/octet-stream";
    }

    private String extensionToMime(String filename) {
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
        if (filename.endsWith(".png"))  return "image/png";
        if (filename.endsWith(".gif"))  return "image/gif";
        if (filename.endsWith(".webp")) return "image/webp";
        if (filename.endsWith(".mp4"))  return "video/mp4";
        if (filename.endsWith(".webm")) return "video/webm";
        if (filename.endsWith(".mov"))  return "video/quicktime";
        if (filename.endsWith(".avi"))  return "video/x-msvideo";
        if (filename.endsWith(".mkv"))  return "video/x-matroska";
        if (filename.endsWith(".mp3"))  return "audio/mpeg";
        if (filename.endsWith(".wav"))  return "audio/wav";
        if (filename.endsWith(".pdf"))  return "application/pdf";
        if (filename.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (filename.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (filename.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        if (filename.endsWith(".doc"))  return "application/msword";
        if (filename.endsWith(".xls"))  return "application/vnd.ms-excel";
        if (filename.endsWith(".ppt"))  return "application/vnd.ms-powerpoint";
        if (filename.endsWith(".txt"))  return "text/plain";
        if (filename.endsWith(".csv"))  return "text/csv";
        if (filename.endsWith(".zip"))  return "application/zip";
        return "application/octet-stream";
    }

    private String extractExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        }
        return switch (contentType) {
            case "image/jpeg"      -> "jpg";
            case "image/png"       -> "png";
            case "image/gif"       -> "gif";
            case "image/webp"      -> "webp";
            case "video/mp4"       -> "mp4";
            case "video/webm"      -> "webm";
            case "audio/mpeg"      -> "mp3";
            case "audio/wav"       -> "wav";
            case "application/pdf" -> "pdf";
            default                -> "bin";
        };
    }

    private AttachmentResponse toResponse(Attachment a) {
        return AttachmentResponse.builder()
                .id(a.getId())
                .postId(a.getPostId())
                .uploaderId(a.getUploaderId())
                .fileName(a.getFileName())
                .fileURL(a.getFileURL())
                .fileSizeBytes(a.getFileSizeBytes())
                .contentType(a.getContentType())
                .attachmentType(a.getAttachmentType())
                .uploadedAt(a.getUploadedAt())
                .build();
    }
}