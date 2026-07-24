package tn.moonside.postservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "reaction_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionType {

    @Id
    private String id;

    @Indexed(unique = true)
    private String code;   // e.g. "LIKE", "LOVE", "HAHA"

    private String emoji;  // e.g. "👍", "❤️", "😂"
    private String name;
    private String description;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
