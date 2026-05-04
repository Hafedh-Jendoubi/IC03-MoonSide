package tn.moonside.postservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import tn.moonside.postservice.enums.TypePosts;
import tn.moonside.postservice.enums.VisibilityType;

@Data
public class PostRequest {

    @NotBlank(message = "Content is required")
    @Size(max = 5000, message = "Content must be at most 5000 characters")
    private String content;

    private TypePosts postType = TypePosts.DISCUSSION;
    private VisibilityType postVisibility = VisibilityType.PUBLIC;

    private String teamId;
    private String departmentId;

    private boolean isPinned = false;
    private boolean isAIGenerated = false;
}
