package tn.moonside.postservice.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth

                // ── Actuator ───────────────────────────────────────────────────
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()

                // ── Reaction types (anyone authenticated can view) ─────────────
                .requestMatchers(HttpMethod.GET, "/reaction-types").authenticated()
                // Only CEO can manage reaction types (enforced via @PreAuthorize)
                .requestMatchers("/reaction-types/**").authenticated()

                // ── Public post feeds ──────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/posts/feed").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/author/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/team/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/department/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/{postId}").authenticated()

                // ── Saved posts ────────────────────────────────────────────────
                .requestMatchers("/posts/saved/**").authenticated()

                // ── Post mutations (owner-checked in service) ──────────────────
                .requestMatchers(HttpMethod.POST,   "/posts").authenticated()
                .requestMatchers(HttpMethod.PUT,    "/posts/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/posts/**").authenticated()

                // ── Comments ───────────────────────────────────────────────────
                .requestMatchers("/posts/*/comments/**").authenticated()

                // ── Reactions ──────────────────────────────────────────────────
                .requestMatchers("/posts/*/reactions/**").authenticated()
                .requestMatchers("/posts/*/comments/*/reactions/**").authenticated()

                // ── Fallback ───────────────────────────────────────────────────
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
