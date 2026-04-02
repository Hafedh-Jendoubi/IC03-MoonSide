package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.requests.*;
import tn.moonside.userservice.dtos.responses.*;
import tn.moonside.userservice.exceptions.DuplicateResourceException;
import tn.moonside.userservice.exceptions.ResourceNotFoundException;
import tn.moonside.userservice.exceptions.UnauthorizedException;
import tn.moonside.userservice.entities.Role;
import tn.moonside.userservice.entities.User;
import tn.moonside.userservice.repositories.RoleRepository;
import tn.moonside.userservice.repositories.UserRepository;
import tn.moonside.userservice.repositories.UserRoleRepository;
import tn.moonside.userservice.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base32;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JavaMailSender mailSender;

    @Value("${app.name:WorkSphere}")
    private String appName;

    @Value("${spring.mail.username}")
    private String mailFrom;

    // ─── Register ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .birthDate(request.getBirthDate())
                .phoneNumber(request.getPhoneNumber())
                .jobTitle(request.getJobTitle())
                .bio(request.getBio())
                .avatar(request.getAvatar())
                .isActive(true)
                .build();
        User saved = userRepository.save(user);
        log.info("Registered new user: {}", saved.getEmail());

        UserDetails userDetails = userDetailsService.loadUserByUsername(saved.getEmail());
        return AuthResponse.builder()
                .accessToken(jwtService.generateToken(userDetails))
                .refreshToken(jwtService.generateRefreshToken(userDetails))
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpiration())
                .user(mapToUserResponse(saved))
                .build();
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        log.info("User logged in: {}", user.getEmail());

        // If 2FA is enabled, return partial response - no tokens yet
        if (user.isTwoFactorEnabled()) {
            return AuthResponse.builder()
                    .twoFactorRequired(true)
                    .user(mapToUserResponse(user))
                    .build();
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        return AuthResponse.builder()
                .accessToken(jwtService.generateToken(userDetails))
                .refreshToken(jwtService.generateRefreshToken(userDetails))
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpiration())
                .user(mapToUserResponse(user))
                .twoFactorRequired(false)
                .build();
    }

    // ─── Refresh Token ────────────────────────────────────────────────────────

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        String userEmail = jwtService.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return AuthResponse.builder()
                .accessToken(jwtService.generateToken(userDetails))
                .refreshToken(jwtService.generateRefreshToken(userDetails))
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpiration())
                .user(mapToUserResponse(user))
                .build();
    }

    // ─── Password Reset: Step 1 — send OTP ───────────────────────────────────

    @Override
    @Transactional
    public void sendPasswordResetOtp(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found for: " + request.getEmail()));

        String otp = generateNumericOtp(6);
        user.setPasswordResetOtp(otp);
        user.setPasswordResetOtpExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        sendOtpEmail(user.getEmail(), user.getFirstName(), otp);
        log.info("Password reset OTP sent to {}", user.getEmail());
    }

    // ─── Password Reset: Step 2 — verify OTP ─────────────────────────────────

    @Override
    public void verifyPasswordResetOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found"));
        validateResetOtp(user, request.getOtp());
    }

    // ─── Password Reset: Step 3 — set new password ───────────────────────────

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found"));
        validateResetOtp(user, request.getOtp());

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetOtp(null);
        user.setPasswordResetOtpExpiry(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("Password reset for {}", user.getEmail());
    }

    // ─── 2FA: Setup ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TwoFactorSetupResponse setup2FA(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String secret = generateTotpSecret();
        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        String issuer = appName;
        String accountName = user.getEmail();
        String otpAuthUri = buildOtpAuthUri(issuer, accountName, secret);
        String qrCodeBase64 = generateQrCodeBase64(otpAuthUri);

        return TwoFactorSetupResponse.builder()
                .secret(secret)
                .qrCodeUri(otpAuthUri)
                .qrCodeImage("data:image/png;base64," + qrCodeBase64)
                .build();
    }

    // ─── 2FA: Enable ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void enable2FA(String userId, String code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getTwoFactorSecret() == null) {
            throw new UnauthorizedException("2FA setup not initiated. Call /auth/2fa/setup first.");
        }
        if (!verifyTotp(user.getTwoFactorSecret(), code)) {
            throw new UnauthorizedException("Invalid 2FA code");
        }
        user.setTwoFactorEnabled(true);
        userRepository.save(user);
        log.info("2FA enabled for {}", user.getEmail());
    }

    // ─── 2FA: Disable ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void disable2FA(String userId, String code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!user.isTwoFactorEnabled()) {
            throw new UnauthorizedException("2FA is not enabled for this account");
        }
        if (!verifyTotp(user.getTwoFactorSecret(), code)) {
            throw new UnauthorizedException("Invalid 2FA code");
        }
        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
        log.info("2FA disabled for {}", user.getEmail());
    }

    // ─── 2FA: Get status ──────────────────────────────────────────────────────

    @Override
    public TwoFactorStatusResponse get2FAStatus(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return TwoFactorStatusResponse.builder()
                .twoFactorEnabled(user.isTwoFactorEnabled())
                .build();
    }

    // ─── 2FA: Complete login ──────────────────────────────────────────────────

    @Override
    public AuthResponse verify2FALogin(TwoFactorVerifyRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        if (!user.isTwoFactorEnabled() || user.getTwoFactorSecret() == null) {
            throw new UnauthorizedException("2FA not set up for this account");
        }
        if (!verifyTotp(user.getTwoFactorSecret(), request.getCode())) {
            throw new UnauthorizedException("Invalid 2FA code");
        }
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        return AuthResponse.builder()
                .accessToken(jwtService.generateToken(userDetails))
                .refreshToken(jwtService.generateRefreshToken(userDetails))
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpiration())
                .user(mapToUserResponse(user))
                .twoFactorRequired(false)
                .build();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void validateResetOtp(User user, String otp) {
        if (user.getPasswordResetOtp() == null || user.getPasswordResetOtpExpiry() == null) {
            throw new UnauthorizedException("No OTP requested for this account");
        }
        if (LocalDateTime.now().isAfter(user.getPasswordResetOtpExpiry())) {
            throw new UnauthorizedException("OTP has expired. Please request a new one.");
        }
        if (!user.getPasswordResetOtp().equals(otp)) {
            throw new UnauthorizedException("Invalid OTP");
        }
    }

    private List<String> resolveRoleNames(String userId) {
        return userRoleRepository.findByUserIdFlexible(userId).stream()
                .map(ur -> findRoleById(ur.getRoleId()))
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .map(Role::getName)
                .distinct()
                .collect(Collectors.toList());
    }

    private java.util.Optional<Role> findRoleById(String roleId) {
        if (roleId == null) return java.util.Optional.empty();
        java.util.Optional<Role> role = roleRepository.findById(roleId);
        if (role.isPresent()) return role;
        if (org.bson.types.ObjectId.isValid(roleId)) {
            return roleRepository.findById(new org.bson.types.ObjectId(roleId).toHexString());
        }
        return java.util.Optional.empty();
    }

    private UserResponse mapToUserResponse(User user) {
        List<String> roles = user.getId() != null ? resolveRoleNames(user.getId()) : List.of();
        return UserResponse.builder()
                .id(user.getId())
                .roles(roles)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .birthDate(user.getBirthDate())
                .phoneNumber(user.getPhoneNumber())
                .jobTitle(user.getJobTitle())
                .bio(user.getBio())
                .avatar(user.getAvatar())
                .isActive(user.isActive())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String generateNumericOtp(int length) {
        Random rnd = new Random();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) sb.append(rnd.nextInt(10));
        return sb.toString();
    }

    private void sendOtpEmail(String to, String name, String otp) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(mailFrom);
        msg.setTo(to);
        msg.setSubject(appName + " — Password Reset Code");
        msg.setText(
            "Hi " + name + ",\n\n" +
            "Your password reset code is:\n\n" +
            "  " + otp + "\n\n" +
            "This code expires in 15 minutes.\n\n" +
            "If you did not request a password reset, please ignore this email.\n\n" +
            "— The " + appName + " Team"
        );
        mailSender.send(msg);
    }

    private String generateTotpSecret() {
        byte[] buffer = new byte[20];
        new SecureRandom().nextBytes(buffer);
        return new Base32().encodeToString(buffer);
    }

    private String buildOtpAuthUri(String issuer, String account, String secret) {
        String encodedIssuer  = URLEncoder.encode(issuer,  StandardCharsets.UTF_8);
        String encodedAccount = URLEncoder.encode(account, StandardCharsets.UTF_8);
        return "otpauth://totp/" + encodedIssuer + ":" + encodedAccount
                + "?secret=" + secret
                + "&issuer=" + encodedIssuer
                + "&algorithm=SHA1&digits=6&period=30";
    }

    private String generateQrCodeBase64(String content) {
        try {
            com.google.zxing.qrcode.QRCodeWriter writer = new com.google.zxing.qrcode.QRCodeWriter();
            com.google.zxing.common.BitMatrix matrix = writer.encode(
                    content,
                    com.google.zxing.BarcodeFormat.QR_CODE,
                    200, 200);
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(matrix, "PNG", baos);
            return java.util.Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            log.warn("QR code generation failed, returning empty string", e);
            return "";
        }
    }

    private boolean verifyTotp(String base32Secret, String code) {
        if (code == null || code.length() != 6) return false;
        long timeStep = System.currentTimeMillis() / 1000L / 30L;
        for (long delta = -1; delta <= 1; delta++) {
            try {
                if (generateTotp(base32Secret, timeStep + delta).equals(code)) return true;
            } catch (Exception ignored) { }
        }
        return false;
    }

    private String generateTotp(String base32Secret, long counter)
            throws NoSuchAlgorithmException, InvalidKeyException {
        byte[] key = new Base32().decode(base32Secret);
        byte[] msg = ByteBuffer.allocate(8).putLong(counter).array();
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(new SecretKeySpec(key, "HmacSHA1"));
        byte[] hash = mac.doFinal(msg);
        int offset = hash[hash.length - 1] & 0x0F;
        int otp = ((hash[offset]     & 0x7F) << 24)
                | ((hash[offset + 1] & 0xFF) << 16)
                | ((hash[offset + 2] & 0xFF) << 8)
                | (hash[offset + 3]  & 0xFF);
        return String.format("%06d", otp % 1_000_000);
    }
}
