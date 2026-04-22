package tn.moonside.organizationservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.moonside.organizationservice.enums.FollowTargetType;

import java.time.LocalDateTime;

@Document(collection = "follows")
@CompoundIndex(name = "follow_unique", def = "{'userId': 1, 'targetId': 1, 'targetType': 1}", unique = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Follow {

    @Id
    private String id;

    /** The user who is following */
    private String userId;

    /** The ID of the department or team being followed */
    private String targetId;

    /** Whether this is a department follow or a team follow */
    private FollowTargetType targetType;

    @Builder.Default
    private LocalDateTime followedAt = LocalDateTime.now();
}
