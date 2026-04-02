package tn.moonside.userservice.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                // ── Public auth endpoints ───────────────────────────────────
                .requestMatchers(
                    "/auth/login",
                    "/auth/register",
                    "/auth/refresh",
                    "/auth/forgot-password",
                    "/auth/verify-otp",
                    "/auth/reset-password",
                    "/auth/2fa/verify-login"
                ).permitAll()
                // ── Actuator ────────────────────────────────────────────────
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                // ── Admin-only routes ────────────────────────────────────────
                // Role management (create/update/delete) — ADMIN only
                .requestMatchers(HttpMethod.POST,   "/roles/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/roles/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/roles/**").hasRole("ADMIN")
                // Permission management — ADMIN only
                .requestMatchers("/permissions/**").hasRole("ADMIN")
                // Assign / revoke roles on users — ADMIN only
                .requestMatchers(HttpMethod.POST,   "/users/*/roles").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/users/*/roles/**").hasRole("ADMIN")
                // Activate / deactivate users — ADMIN only
                .requestMatchers(HttpMethod.PATCH,  "/users/*/deactivate").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH,  "/users/*/activate").hasRole("ADMIN")
                // Delete users — ADMIN only
                .requestMatchers(HttpMethod.DELETE, "/users/**").hasRole("ADMIN")
                // ── Authenticated read-only routes ───────────────────────────
                .requestMatchers(HttpMethod.GET, "/roles/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/users/**").authenticated()
                // ── Everything else needs authentication ─────────────────────
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
