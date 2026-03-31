package tn.moonside.userservice.controllers;

import tn.moonside.userservice.dtos.requests.*;
import tn.moonside.userservice.dtos.responses.*;
import tn.moonside.userservice.services.AuthService;
import tn.moonside.userservice.security.UserDetailsServiceImpl.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ─── Existing ─────────────────────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(authService.register(request), "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request), "Login successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestHeader("X-Refresh-Token") String refreshToken) {
        return ResponseEntity.ok(ApiResponse.success(
                authService.refreshToken(refreshToken), "Token refreshed successfully"));
    }

    // ─── Password Reset ───────────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.sendPasswordResetOtp(request);
        return ResponseEntity.ok(ApiResponse.success(null, "OTP sent to your email address"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyPasswordResetOtp(request);
        return ResponseEntity.ok(ApiResponse.success(null, "OTP verified successfully"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
    }

    // ─── 2FA ─────────────────────────────────────────────────────────────────

    /** Step 1 — generate secret + QR code (requires auth) */
    @PostMapping("/2fa/setup")
    public ResponseEntity<ApiResponse<TwoFactorSetupResponse>> setup2FA(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
                authService.setup2FA(getUserId(principal)), "2FA setup initiated"));
    }

    /** Step 2 — confirm first TOTP code to activate 2FA (requires auth) */
    @PostMapping("/2fa/enable")
    public ResponseEntity<ApiResponse<Void>> enable2FA(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam String code) {
        authService.enable2FA(getUserId(principal), code);
        return ResponseEntity.ok(ApiResponse.success(null, "2FA enabled successfully"));
    }

    /** Disable 2FA — requires current TOTP code (requires auth) */
    @PostMapping("/2fa/disable")
    public ResponseEntity<ApiResponse<Void>> disable2FA(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam String code) {
        authService.disable2FA(getUserId(principal), code);
        return ResponseEntity.ok(ApiResponse.success(null, "2FA disabled successfully"));
    }

    /** Get current 2FA status (requires auth) */
    @GetMapping("/2fa/status")
    public ResponseEntity<ApiResponse<TwoFactorStatusResponse>> get2FAStatus(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
                authService.get2FAStatus(getUserId(principal)), "2FA status retrieved"));
    }

    /**
     * Second step of login when 2FA is required — public endpoint, no JWT yet.
     * Verifies TOTP code and returns the full auth tokens.
     */
    @PostMapping("/2fa/verify-login")
    public ResponseEntity<ApiResponse<AuthResponse>> verify2FALogin(
            @Valid @RequestBody TwoFactorVerifyRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                authService.verify2FALogin(request), "2FA verification successful"));
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private String getUserId(UserDetails principal) {
        if (principal instanceof CustomUserDetails custom) {
            return custom.getUserId();
        }
        throw new IllegalStateException("Unexpected principal type: " + principal.getClass());
    }
}
