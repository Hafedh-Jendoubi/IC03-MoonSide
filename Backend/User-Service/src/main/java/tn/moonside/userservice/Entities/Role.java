package tn.moonside.userservice.Entities;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "roles")
public class Role {
    @Id
    private String id;
    private UUID roleId; // Business identifier
    private String name;
    private String description;
    private LocalDateTime createdAt;

    // References to permissions
    @DBRef
    private Set<Permission> permissions = new HashSet<>();
}