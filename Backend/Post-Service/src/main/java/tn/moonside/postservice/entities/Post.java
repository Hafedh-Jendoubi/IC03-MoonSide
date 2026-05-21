package tn.moonside.postservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.moonside.postservice.enums.TypePosts;
import tn.moonside.postservice.enums.VisibilityType;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    private String id;

    @Indexed
    private String authorId;

    @Indexed
    private String teamId;

    @Indexed
    private String departmentId;

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

    // ── Survey fields ──────────────────────────────────────────────────────────
    /** Title/question shown at the top of a SURVEY post. */
    private String surveyQuestion;

    /** Ordered list of voting options. Only populated when postType == SURVEY. */
    private List<SurveyOption> surveyOptions;

    /** Whether the survey is still accepting votes. */
    @Builder.Default
    private boolean surveyOpen = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
