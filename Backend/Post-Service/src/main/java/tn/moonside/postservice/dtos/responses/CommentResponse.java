package tn.moonside.postservice.dtos.responses;

import lombok.*;
import tn.moonside.postservice.enums.VisibilityType;

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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
