package tn.moonside.postservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Stores one vote per user per survey post.
 * Unique compound index on (postId, userId) enforces the one-vote-per-user rule.
 */
@Document(collection = "survey_votes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@CompoundIndex(name = "post_user_unique", def = "{'postId': 1, 'userId': 1}", unique = true)
public class SurveyVote {

    @Id
    private String id;

    private String postId;
    private String userId;
    private String optionId;

    @Builder.Default
    private LocalDateTime votedAt = LocalDateTime.now();
}
