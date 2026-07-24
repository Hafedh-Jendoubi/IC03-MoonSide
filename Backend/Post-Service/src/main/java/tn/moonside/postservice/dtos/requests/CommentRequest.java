package tn.moonside.postservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import tn.moonside.postservice.enums.VisibilityType;

import java.util.Collections;
import java.util.List;

@Data
public class CommentRequest {

    @NotBlank(message = "Content is required")
    @Size(max = 2000, message = "Comment must be at most 2000 characters")
    private String content;

    private VisibilityType postVisibility = VisibilityType.PUBLIC;

    /** Null for top-level comments; set to parent comment ID for replies. */
    private String parentId;

    /**
     * IDs of users explicitly mentioned via @ in this comment.
     * Populated by the frontend; used by the backend to fire MENTION notifications.
     */
    private List<String> mentionedUserIds = Collections.emptyList();
}
