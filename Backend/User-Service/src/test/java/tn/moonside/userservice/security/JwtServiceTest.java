package tn.moonside.userservice.security;

import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        String secret = Base64.getEncoder().encodeToString(
                Keys.hmacShaKeyFor("this-is-a-very-secret-key-for-jwt-testing-purposes-123456".getBytes()).getEncoded());
        ReflectionTestUtils.setField(jwtService, "secretKey", secret);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3600000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 7200000L);

        userDetails = new User("user@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    @Test
    void generateToken_andExtractUsername_roundTrip() {
        String token = jwtService.generateToken(userDetails);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("user@example.com");
    }

    @Test
    void isTokenValid_forCorrectUser_returnsTrue() {
        String token = jwtService.generateToken(userDetails);

        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    void isTokenValid_expiredToken_throwsExpiredJwtException() {
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1000L);
        String token = jwtService.generateToken(userDetails);

        assertThatThrownBy(() -> jwtService.isTokenValid(token, userDetails))
                .isInstanceOf(io.jsonwebtoken.ExpiredJwtException.class);
    }

    @Test
    void generateRefreshToken_isValid() {
        String token = jwtService.generateRefreshToken(userDetails);

        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    void getJwtExpiration_returnsConfiguredValue() {
        assertThat(jwtService.getJwtExpiration()).isEqualTo(3600000L);
    }

    @Test
    void isTokenValid_expiredToken_throwsExpiredJwtException() {
        // extractUsername() parses (and thus validates expiry) before the explicit
        // expiry check runs, so an already-expired token throws rather than
        // returning false — this documents that actual behavior.
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1000L);
        String token = jwtService.generateToken(userDetails);

        assertThatThrownBy(() -> jwtService.isTokenValid(token, userDetails))
                .isInstanceOf(io.jsonwebtoken.ExpiredJwtException.class);
    }

    @Test
    void extractClaim_extractsCustomClaim() {
        String token = jwtService.generateToken(userDetails);

        String subject = jwtService.extractClaim(token, claims -> claims.getSubject());
        assertThat(subject).isEqualTo("user@example.com");
    }
}