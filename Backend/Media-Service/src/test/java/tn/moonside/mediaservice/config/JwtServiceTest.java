package tn.moonside.mediaservice.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    // 256-bit key, base64-encoded, matching the format expected by JwtService
    private static final SecretKey RAW_KEY = Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256);
    private static final String SECRET = Base64.getEncoder().encodeToString(RAW_KEY.getEncoded());

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", SECRET);
    }

    private String buildToken(String subject, Date expiration) {
        return Jwts.builder()
                .subject(subject)
                .expiration(expiration)
                .signWith(RAW_KEY)
                .compact();
    }

    @Test
    void extractEmail_returnsSubjectFromValidToken() {
        String token = buildToken("user@example.com", new Date(System.currentTimeMillis() + 60_000));

        String email = jwtService.extractEmail(token);

        assertThat(email).isEqualTo("user@example.com");
    }

    @Test
    void isTokenValid_validToken_returnsTrue() {
        String token = buildToken("user@example.com", new Date(System.currentTimeMillis() + 60_000));

        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_expiredToken_returnsFalse() {
        String token = buildToken("user@example.com", new Date(System.currentTimeMillis() - 60_000));

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
