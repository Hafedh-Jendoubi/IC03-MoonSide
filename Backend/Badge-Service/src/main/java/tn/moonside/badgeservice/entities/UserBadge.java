package tn.moonside.badgeservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.moonside.badgeservice.enums.BadgeType;

import java.time.LocalDateTime;

/**
 * Records that a specific user has earned a specific badge.
 * The compound index ensures we never award the same badge twice.
 */
@Document(collection = "user_badges")
@CompoundIndexes({
    @CompoundIndex(name = "user_badge_unique_idx",
            def = "{'userId': 1, 'badgeType': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBadge {

    @Id
    private String id;

    @Indexed
    private String userId;

    private BadgeType badgeType;

    @Builder.Default
    private LocalDateTime awardedAt = LocalDateTime.now();
}
