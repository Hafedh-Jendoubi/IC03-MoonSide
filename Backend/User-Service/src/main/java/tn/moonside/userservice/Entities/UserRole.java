package tn.moonside.userservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import java.time.LocalDateTime;

@Document(collection = "user_roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@CompoundIndexes({
        @CompoundIndex(name = "user_role_scope_idx", def = "{'userId': 1, 'roleId': 1, 'scopeType': 1, 'scopeId': 1}", unique = true)
})
public class UserRole {

    @Id
    private String id;

    private String userId;

    private String roleId;

    private TypeScope scopeType;

    private String scopeId;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime assignedAt = LocalDateTime.now();
}
