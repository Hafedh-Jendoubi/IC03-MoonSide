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
    private String roleId;
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
    @Builder.Default
    private boolean isActive = true;
    private String updatedBy;
    private LocalDateTime lastLogin;
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    // ── Password Reset ────────────────────────────────────────────────────────
    private String passwordResetOtp;
    private LocalDateTime passwordResetOtpExpiry;

    // ── Two-Factor Authentication (TOTP) ──────────────────────────────────────
    @Builder.Default
    private boolean twoFactorEnabled = false;
    private String twoFactorSecret;           // base32-encoded TOTP secret
}
