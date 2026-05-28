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

                // ── Reaction Types ─────────────────────────────────────────────
                // Any authenticated user can view reaction types
                .requestMatchers(HttpMethod.GET, "/reaction-types").authenticated()
                // Only CEO can create or delete reaction types
                .requestMatchers(HttpMethod.POST,   "/reaction-types").hasRole("CEO")
                .requestMatchers(HttpMethod.DELETE, "/reaction-types/**").hasRole("CEO")

                // ── Read post feeds (every authenticated user) ─────────────────
                .requestMatchers(HttpMethod.GET, "/posts/feed").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/feed/following").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/author/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/team/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/department/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/{postId}").authenticated()

                // ── Saved posts (every authenticated user) ─────────────────────
                .requestMatchers("/posts/saved/**").authenticated()

                // ── Create post (EMPLOYEE and above — not HR read-only) ────────
                .requestMatchers(HttpMethod.POST, "/posts")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── Edit own post (author checked in service) ──────────────────
                .requestMatchers(HttpMethod.PUT, "/posts/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── Delete post:
                //    CEO/HR can delete any post (moderation)
                //    Others can delete their own (ownership enforced in service)
                .requestMatchers(HttpMethod.DELETE, "/posts/**")
                    .hasAnyRole("CEO", "HUMAN_RESOURCES", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── Pin/unpin post (Team Leader, Dept Leader, CEO) ─────────────
                .requestMatchers(HttpMethod.PATCH, "/posts/*/pin")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER")

                // ── Comments — read (every authenticated user) ─────────────────
                .requestMatchers(HttpMethod.GET, "/posts/*/comments/**").authenticated()

                // ── Comments — create/edit/delete own
                .requestMatchers(HttpMethod.POST, "/posts/*/comments")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")
                .requestMatchers(HttpMethod.PUT, "/posts/*/comments/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── Comments — delete (moderation: CEO/HR can delete any)
                .requestMatchers(HttpMethod.DELETE, "/posts/*/comments/**")
                    .hasAnyRole("CEO", "HUMAN_RESOURCES", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── Reactions — every authenticated user ───────────────────────
                .requestMatchers("/posts/*/reactions/**").authenticated()
                .requestMatchers("/posts/*/comments/*/reactions/**").authenticated()

                // ── Attachments — read (every authenticated user) ──────────────
                .requestMatchers(HttpMethod.GET, "/posts/*/attachments/**").authenticated()

                // ── Attachments — upload/delete (post authors, not read-only HR)
                .requestMatchers(HttpMethod.POST, "/posts/*/attachments")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")
                .requestMatchers(HttpMethod.DELETE, "/posts/*/attachments/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── Survey voting (every authenticated user) ───────────────────
                .requestMatchers(HttpMethod.POST, "/posts/*/survey/vote").authenticated()

                // ── Fallback ───────────────────────────────────────────────────
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
