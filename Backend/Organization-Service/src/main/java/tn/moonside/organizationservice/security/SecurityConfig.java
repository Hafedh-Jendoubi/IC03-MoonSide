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
                .requestMatchers(HttpMethod.GET, "/organizations/departments/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/public").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/search").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/{teamId}").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/{teamId}/members").authenticated()

                // ── User self-service ─────────────────────────────────────────
                .requestMatchers(HttpMethod.POST, "/organizations/teams/{teamId}/join").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/organizations/teams/{teamId}/leave").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/my").authenticated()

                // ── Follow system (any authenticated user) ────────────────────
                .requestMatchers(HttpMethod.POST, "/organizations/departments/{id}/follow").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/organizations/departments/{id}/follow").authenticated()
                .requestMatchers(HttpMethod.POST, "/organizations/teams/{teamId}/follow").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/organizations/teams/{teamId}/follow").authenticated()

                // ── Assign member (Team Leader, Dept Leader, HR, CEO) ─────────
                .requestMatchers(HttpMethod.POST, "/organizations/teams/{teamId}/assign/{userId}")
                    .hasAnyRole("CEO", "TEAM_LEADER", "DEPARTMENT_LEADER", "HUMAN_RESOURCES")

                // ── CEO-only mutations ──────────────────────────────────────
                .requestMatchers(HttpMethod.POST,   "/organizations/departments/**").hasRole("CEO")
                .requestMatchers(HttpMethod.DELETE, "/organizations/departments/**").hasRole("CEO")

                // CEO + Department Leader
                .requestMatchers(HttpMethod.PATCH, "/organizations/departments/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER")

                // Department Leader (instead of MANAGER)
                .requestMatchers(HttpMethod.PUT, "/organizations/departments/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER")

                .requestMatchers(HttpMethod.POST,   "/organizations/teams").hasRole("CEO")
                .requestMatchers(HttpMethod.DELETE, "/organizations/teams/**").hasRole("CEO")

                // Team updates
                .requestMatchers(HttpMethod.PATCH, "/organizations/teams/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER")

                .requestMatchers(HttpMethod.PUT, "/organizations/teams/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER")

                // ── Everything else requires auth ─────────────────────────────
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}