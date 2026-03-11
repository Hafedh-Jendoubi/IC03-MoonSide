package tn.moonside.userservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

@Document(collection = "permission_roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@CompoundIndexes({
        @CompoundIndex(name = "role_permission_idx", def = "{'roleId': 1, 'permissionId': 1}", unique = true)
})
public class PermissionRole {

    @Id
    private String id;

    private String roleId;

    private String permissionId;
}