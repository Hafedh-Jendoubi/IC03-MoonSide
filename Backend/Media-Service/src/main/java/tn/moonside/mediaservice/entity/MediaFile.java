package tn.moonside.mediaservice.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "media_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaFile {

    @Id
    private String id;

    /** The user who uploaded this file */
    private String uploadedBy;

    /** Original filename from the client */
    private String originalFilename;

    /** Content-type e.g. image/jpeg */
    private String contentType;

    /** Size in bytes */
    private long size;

    /** Object key inside MinIO bucket */
    private String objectKey;

    /** Public URL ready to be stored in the User avatar field */
    private String url;

    /** Logical category: AVATAR, POST_ATTACHMENT, etc. */
    private String context;

    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
