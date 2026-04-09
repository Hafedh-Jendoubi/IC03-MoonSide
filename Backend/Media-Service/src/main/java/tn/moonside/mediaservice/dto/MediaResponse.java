package tn.moonside.mediaservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MediaResponse {
    private String id;
    private String uploadedBy;
    private String originalFilename;
    private String contentType;
    private long size;
    private String url;
    private String context;
    private LocalDateTime uploadedAt;
}
