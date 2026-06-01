package tn.moonside.postservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "saved_posts")
@CompoundIndexes({
    @CompoundIndex(name = "user_post_idx", def = "{'userId': 1, 'postId': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedPost {

    @Id
    private String id;

    private String userId;
    private String postId;

    @Builder.Default
    private LocalDateTime savedAt = LocalDateTime.now();
}
