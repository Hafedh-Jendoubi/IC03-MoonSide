package tn.moonside.postservice.dtos.responses;

import lombok.*;
import tn.moonside.postservice.enums.VisibilityType;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CommentResponse {
    private String id;
    private String authorId;
    private String postId;
    private String content;
    private VisibilityType postVisibility;
    private boolean isPinned;
    private boolean isEdited;
    private String parentId;
    private long reactionCount;
    private long replyCount;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}