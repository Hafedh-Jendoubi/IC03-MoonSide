package tn.moonside.postservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import tn.moonside.postservice.enums.VisibilityType;

@Data
public class CommentRequest {

    @NotBlank(message = "Content is required")
    @Size(max = 2000, message = "Comment must be at most 2000 characters")
    private String content;

    private VisibilityType postVisibility = VisibilityType.PUBLIC;

    /** Null for top-level comments; set to parent comment ID for replies. */
    private String parentId;
}
