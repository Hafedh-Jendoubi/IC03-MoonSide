package tn.moonside.notificationservice.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final SecretKey RAW_KEY = Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256);
    private static final String SECRET = Base64.getEncoder().encodeToString(RAW_KEY.getEncoded());

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", SECRET);
    }

    private String buildToken(String subject, Date expiration, Map<String, Object> extraClaims) {
        return Jwts.builder()
                .subject(subject)
                .claims(extraClaims)
                .expiration(expiration)
                .signWith(RAW_KEY)
                .compact();
    }

    @Test
    void extractUsername_returnsSubject() {
        String token = buildToken("user@example.com", new Date(System.currentTimeMillis() + 60_000), Map.of());

        assertThat(jwtService.extractUsername(token)).isEqualTo("user@example.com");
    }

    @Test
    void extractUserId_returnsUserIdClaim() {
        String token = buildToken("user@example.com", new Date(System.currentTimeMillis() + 60_000),
                Map.of("userId", "u123"));

        assertThat(jwtService.extractUserId(token)).isEqualTo("u123");
    }

    @Test
    void extractUserId_missingClaim_returnsNull() {
        String token = buildToken("user@example.com", new Date(System.currentTimeMillis() + 60_000), Map.of());

        assertThat(jwtService.extractUserId(token)).isNull();
    }

    @Test
    void extractRoles_returnsRolesClaim() {
        String token = buildToken("user@example.com", new Date(System.currentTimeMillis() + 60_000),
                Map.of("roles", List.of("ADMIN", "USER")));

        assertThat(jwtService.extractRoles(token)).containsExactly("ADMIN", "USER");
    }

    @Test
    void isTokenValid_validToken_returnsTrue() {
        String token = buildToken("user@example.com", new Date(System.currentTimeMillis() + 60_000), Map.of());

        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_expiredToken_returnsFalse() {
        String token = buildToken("user@example.com", new Date(System.currentTimeMillis() - 60_000), Map.of());

        assertThat(jwtService.isTokenValid(token)).isFalse();
    }

    @Test
    void isTokenValid_malformedToken_returnsFalse() {
        assertThat(jwtService.isTokenValid("not-a-real-token")).isFalse();
    }

    @Test
    void isTokenValid_tokenSignedWithDifferentKey_returnsFalse() {
        SecretKey otherKey = Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256);
        String token = Jwts.builder()
                .subject("user@example.com")
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(otherKey)
                .compact();

        assertThat(jwtService.isTokenValid(token)).isFalse();
    }
}
