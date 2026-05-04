package tn.moonside.postservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

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

    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
