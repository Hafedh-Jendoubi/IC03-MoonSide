package tn.moonside.organizationservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "user_teams")
@CompoundIndex(name = "user_team_unique", def = "{'userId': 1, 'teamId': 1}", unique = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTeam {

    @Id
    private String id;

    private String userId;
    private String teamId;

    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();
}
