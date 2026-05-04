package tn.moonside.postservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.moonside.postservice.enums.TypePosts;
import tn.moonside.postservice.enums.VisibilityType;

import java.time.LocalDateTime;

@Document(collection = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    private String id;

    /** ID of the user who authored the post (from user-service). */
    @Indexed
    private String authorId;

    /** Optional: ID of the team this post belongs to. */
    @Indexed
    private String teamId;

    /** Optional: ID of the department this post belongs to. */
    @Indexed
    private String departmentId;

    /** ID of the last user who edited the post. */
    private String updatedBy;

    private String content;

    @Builder.Default
    private TypePosts postType = TypePosts.DISCUSSION;

    @Builder.Default
    private VisibilityType postVisibility = VisibilityType.PUBLIC;

    @Builder.Default
    private boolean isPinned = false;

    @Builder.Default
    private boolean isAIGenerated = false;

    @Builder.Default
    private int viewCount = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
