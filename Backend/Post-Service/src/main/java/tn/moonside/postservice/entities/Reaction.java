package tn.moonside.postservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "reactions")
@CompoundIndexes({
    @CompoundIndex(
        name = "user_reactable_idx",
        def = "{'userId': 1, 'reactableType': 1, 'reactableId': 1}",
        unique = true
    )
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reaction {

    @Id
    private String id;

    @Indexed
    private String userId;

    /** FK to reaction_types collection. */
    private String reactionTypeId;

    /** "POST" or "COMMENT" — polymorphic target. */
    private String reactableType;

    /** ID of the post or comment being reacted to. */
    @Indexed
    private String reactableId;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
