package tn.moonside.postservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.moonside.postservice.enums.VisibilityType;

import java.time.LocalDateTime;

@Document(collection = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    private String id;

    private String authorId;

    @Indexed
    private String postId;

    private String content;

    @Builder.Default
    private VisibilityType postVisibility = VisibilityType.PUBLIC;

    @Builder.Default
    private boolean isPinned = false;

    @Builder.Default
    private boolean isEdited = false;

    /** ID of the parent comment (null = top-level comment). */
    @Indexed
    private String parentId;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
