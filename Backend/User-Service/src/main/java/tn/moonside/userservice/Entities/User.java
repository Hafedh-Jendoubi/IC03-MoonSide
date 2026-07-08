package tn.moonside.userservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    private String id;
    @Indexed(unique = true)
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private String phoneNumber;
    private String jobTitle;
    private String bio;
    private String avatar;
    /** URL to the user's profile banner image, stored in media-service. */
    private String bannerUrl;
    @Builder.Default
    private boolean isActive = true;
    private String updatedBy;
    private LocalDateTime lastLogin;
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    // ── Email Verification ───────────────────────────────────────────────────
    @Builder.Default
    private boolean emailVerified = false;

    // ── Two-Factor Authentication (TOTP) ──────────────────────────────────────
    @Builder.Default
    private boolean twoFactorEnabled = false;
    private String twoFactorSecret;           // base32-encoded TOTP secret

    // ── First-login password change ───────────────────────────────────────────
    @Builder.Default
    private boolean mustChangePassword = false;

    // ── Daily-login streak (drives login-streak badges) ───────────────────────
    /** Consecutive calendar days the user has logged in, ending today/yesterday. */
    @Builder.Default
    private int loginStreak = 0;
    /** Highest streak ever reached — badges are awarded off this so they never get revoked. */
    @Builder.Default
    private int longestLoginStreak = 0;
    /** Calendar date (no time) of the most recent login, used to compute the streak. */
    private LocalDate lastLoginDate;
}
