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
@Document(collection = "users")
public class User {
    @Id
    private String id; // MongoDB will generate this, but we'll also keep userId for business logic
    private UUID userId; // This will be our business identifier
    private String email;
    private String password;
    private String firstname;
    private String lastname;
    private LocalDateTime birthDate;
    private String phoneNumber;
    private String jobTitle;
    private String bio;
    private String avatar;
    private boolean isActive;
    private UUID updatedBy;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;

    // References to roles (many-to-many relationship)
    @DBRef
    private Set<Role> roles = new HashSet<>();
}
