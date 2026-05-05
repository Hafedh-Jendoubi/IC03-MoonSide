package tn.moonside.postservice.dtos.responses;

import lombok.*;
import tn.moonside.postservice.enums.TypePosts;
import tn.moonside.postservice.enums.VisibilityType;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private String id;
    private String authorId;
    private String teamId;
    private String departmentId;
    private String updatedBy;
    private String content;
    private TypePosts postType;
    private VisibilityType postVisibility;
    private boolean isPinned;
    private boolean isAIGenerated;
    private int viewCount;
    private long commentCount;
    private long reactionCount;
    private List<AttachmentResponse> attachments;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}