package tn.moonside.userservice.Entities;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.moonside.userservice.Enums.TypeScope;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "permissions")
public class Permission {
    @Id
    private String id;
    private UUID permissionId; // Business identifier
    private String action;
    private TypeScope scopeType;
    private String description;
    private LocalDateTime createdAt;
}