package tn.moonside.organizationservice.security;

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

                // ── Actuator ─────────────────────────────────────────────────
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()

                // ── Public discovery (GET only) ───────────────────────────────
                // Any authenticated user can browse departments and public teams
                .requestMatchers(HttpMethod.GET, "/organizations/departments/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/public").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/search").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/{teamId}").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/{teamId}/members").authenticated()

                // ── User self-service ─────────────────────────────────────────
                // Any authenticated user can join or leave a team
                .requestMatchers(HttpMethod.POST, "/organizations/teams/{teamId}/join").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/organizations/teams/{teamId}/leave").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/my").authenticated()

                // ── Admin-only mutations ──────────────────────────────────────
                .requestMatchers(HttpMethod.POST,   "/organizations/departments/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/organizations/departments/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH,  "/organizations/departments/**").hasRole("ADMIN")

                // Department Managers can update their own department
                .requestMatchers(HttpMethod.PUT,    "/organizations/departments/**")
                    .hasAnyRole("ADMIN", "DEPARTMENT_MANAGER")

                .requestMatchers(HttpMethod.POST,   "/organizations/teams").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/organizations/teams/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH,  "/organizations/teams/**").hasRole("ADMIN")

                // Team Leaders can update their own team; Dept Managers can update teams in their dept
                .requestMatchers(HttpMethod.PUT,    "/organizations/teams/**")
                    .hasAnyRole("ADMIN", "DEPARTMENT_MANAGER", "TEAM_LEADER")

                // ── Everything else requires auth ─────────────────────────────
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
