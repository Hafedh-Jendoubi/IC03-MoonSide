package tn.moonside.postservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.moonside.postservice.enums.AttachmentType;

import java.time.LocalDateTime;

@Document(collection = "attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    private String id;

    @Indexed
    private String postId;

    private String uploaderId;
    private String updatedBy;

    private String fileName;
    private String fileURL;
    private Long fileSizeBytes;

    /** MIME content-type, e.g. "image/jpeg", "video/mp4", "application/pdf" */
    private String contentType;

    /** High-level category derived from content-type (IMAGE, VIDEO, DOCUMENT, OTHER) */
    private AttachmentType attachmentType;

    /** MinIO object key — stored so we can delete cleanly without parsing the URL */
    private String objectKey;

    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
