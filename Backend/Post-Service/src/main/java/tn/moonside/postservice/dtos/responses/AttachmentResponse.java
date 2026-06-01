package tn.moonside.postservice.dtos.responses;

import lombok.*;
import tn.moonside.postservice.enums.AttachmentType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {
    private String id;
    private String postId;
    private String uploaderId;
    private String fileName;
    private String fileURL;
    private Long fileSizeBytes;
    private String contentType;
    private AttachmentType attachmentType;
    private LocalDateTime uploadedAt;
}
