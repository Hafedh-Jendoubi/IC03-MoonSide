package tn.moonside.userservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Manages short-lived OTP values in Redis.
 *
 * Keys are namespaced by purpose so the same email can have independent
 * OTPs for email-verification and password-reset simultaneously.
 *
 * Replaces the OTP + expiry fields that were previously stored directly
 * on the User document. Advantages:
 *  - Automatic TTL-based expiry — no scheduler / manual cleanup needed.
 *  - Atomic single-use consumption (get + delete in one path).
 *  - No DB write required to store or clear an OTP.
 *  - User document stays clean; security-sensitive values never persisted long-term.
 */
@Service
@RequiredArgsConstructor
public class OtpRedisService {

    private static final String PREFIX_EMAIL_VERIFY = "otp:email-verify:";
    private static final String PREFIX_PASSWORD_RESET = "otp:password-reset:";

    private final StringRedisTemplate redis;

    // ── Email-verification OTP ────────────────────────────────────────────────

    /** Store a 6-digit email-verification OTP, valid for 15 minutes. */
    public void storeEmailVerificationOtp(String email, String otp) {
        redis.opsForValue().set(PREFIX_EMAIL_VERIFY + email, otp, Duration.ofMinutes(15));
    }

    /**
     * Validate and consume the email-verification OTP.
     * Returns {@code true} and deletes the key if the OTP matches.
     * Returns {@code false} if missing, expired, or wrong.
     */
    public boolean verifyAndConsumeEmailOtp(String email, String otp) {
        String key = PREFIX_EMAIL_VERIFY + email;
        String stored = redis.opsForValue().get(key);
        if (stored == null || !stored.equals(otp)) return false;
        redis.delete(key);
        return true;
    }

    /** True if an unexpired email-verification OTP exists for this email. */
    public boolean emailOtpExists(String email) {
        return Boolean.TRUE.equals(redis.hasKey(PREFIX_EMAIL_VERIFY + email));
    }

    // ── Password-reset OTP ────────────────────────────────────────────────────

    /** Store a 6-digit password-reset OTP, valid for 15 minutes. */
    public void storePasswordResetOtp(String email, String otp) {
        redis.opsForValue().set(PREFIX_PASSWORD_RESET + email, otp, Duration.ofMinutes(15));
    }

    /**
     * Validate and consume the password-reset OTP.
     * Returns {@code true} and deletes the key if the OTP matches.
     */
    public boolean verifyAndConsumePasswordResetOtp(String email, String otp) {
        String key = PREFIX_PASSWORD_RESET + email;
        String stored = redis.opsForValue().get(key);
        if (stored == null || !stored.equals(otp)) return false;
        redis.delete(key);
        return true;
    }

    /**
     * Check the password-reset OTP without consuming it.
     * Used by the "verify OTP" step that precedes the actual reset,
     * so the code remains valid for the subsequent reset call.
     */
    public boolean peekPasswordResetOtp(String email, String otp) {
        String stored = redis.opsForValue().get(PREFIX_PASSWORD_RESET + email);
        return stored != null && stored.equals(otp);
    }

    /** True if an unexpired password-reset OTP exists for this email. */
    public boolean passwordResetOtpExists(String email) {
        return Boolean.TRUE.equals(redis.hasKey(PREFIX_PASSWORD_RESET + email));
    }
}
