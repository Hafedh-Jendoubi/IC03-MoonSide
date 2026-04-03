package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.requests.*;
import tn.moonside.userservice.dtos.responses.AuthResponse;
import tn.moonside.userservice.dtos.responses.TwoFactorSetupResponse;
import tn.moonside.userservice.dtos.responses.TwoFactorStatusResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);

    // ── Email Verification ────────────────────────────────────────────────────
    void verifyEmail(VerifyEmailRequest request);
    void resendEmailVerificationOtp(String email);

    // ── Password Reset ────────────────────────────────────────────────────────
    void sendPasswordResetOtp(ForgotPasswordRequest request);
    void verifyPasswordResetOtp(VerifyOtpRequest request);
    void resetPassword(ResetPasswordRequest request);

    // ── 2FA ───────────────────────────────────────────────────────────────────
    TwoFactorSetupResponse setup2FA(String userId);
    void enable2FA(String userId, String code);
    void disable2FA(String userId, String code);
    TwoFactorStatusResponse get2FAStatus(String userId);
    AuthResponse verify2FALogin(TwoFactorVerifyRequest request);
}
