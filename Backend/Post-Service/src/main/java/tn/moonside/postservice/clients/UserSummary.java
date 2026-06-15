package tn.moonside.postservice.clients;

import lombok.Builder;
import lombok.Data;

/**
 * Minimal user projection returned by the user-service internal endpoint.
 * Only contains fields needed for human-readable audit log descriptions.
 */
@Data
@Builder
public class UserSummary {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String jobTitle;
    private String avatarUrl;

    /** Returns "FirstName LastName", or email as fallback, or the raw id as last resort. */
    public String displayName() {
        if (firstName != null && !firstName.isBlank() && lastName != null && !lastName.isBlank()) {
            return firstName + " " + lastName;
        }
        if (firstName != null && !firstName.isBlank()) return firstName;
        if (email != null && !email.isBlank()) return email;
        return id;
    }
}
