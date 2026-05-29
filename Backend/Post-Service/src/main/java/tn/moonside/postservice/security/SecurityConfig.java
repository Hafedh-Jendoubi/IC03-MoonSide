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

/**
 * Post-Service security configuration.
 *
 * ── Strategy ──────────────────────────────────────────────────────────────────
 * All requests require a valid JWT.  Fine-grained access control is expressed
 * via hasRole() rules here rather than a custom annotation filter, because the
 * Post-Service does not have a local copy of the permission → role mapping.
 *
 * The source of truth for which roles hold which permissions lives in the
 * User-Service DataSeeder and AppPermission.  The role names used below must
 * stay in sync with the roles seeded there.
 *
 * ── Role hierarchy reminder ───────────────────────────────────────────────────
 *   CEO               — everything (ANYTHING wildcard in User-Service)
 *   DEPARTMENT_LEADER — manage department, moderate comments, pin in dept feed
 *   TEAM_LEADER       — manage team, pin in team feed
 *   HUMAN_RESOURCES   — read-only feeds + post/comment moderation
 *   EMPLOYEE          — full interactive access (create, react, comment, etc.)
 *   TEAM_MEMBER       — same as EMPLOYEE
 */
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

                // ── Reaction Types ────────────────────────────────────────────
                // POST_REACT / REACTION_TYPE_VIEW: every authenticated user
                .requestMatchers(HttpMethod.GET,    "/reaction-types").authenticated()
                // REACTION_TYPE_CREATE / REACTION_TYPE_DELETE: CEO only
                .requestMatchers(HttpMethod.POST,   "/reaction-types").hasRole("CEO")
                .requestMatchers(HttpMethod.DELETE, "/reaction-types/**").hasRole("CEO")

                // ── POST_VIEW — read feeds (every authenticated user) ─────────
                .requestMatchers(HttpMethod.GET, "/posts/feed").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/feed/following").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/author/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/team/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/department/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/posts/{postId}").authenticated()

                // ── POST_SAVE — bookmarks (every authenticated user) ──────────
                .requestMatchers("/posts/saved/**").authenticated()

                // ── POST_CREATE — create a post (EMPLOYEE and above, not HR) ──
                .requestMatchers(HttpMethod.POST, "/posts")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── POST_EDIT_OWN — edit own post (ownership checked in service)
                .requestMatchers(HttpMethod.PUT, "/posts/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── POST_DELETE_OWN / POST_DELETE_ANY ─────────────────────────
                //    HR and CEO may delete any post (moderation).
                //    Everyone else can delete their own (enforced in service).
                .requestMatchers(HttpMethod.DELETE, "/posts/**")
                    .hasAnyRole("CEO", "HUMAN_RESOURCES", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── POST_PIN_IN_TEAM / POST_PIN_IN_DEPT / POST_PIN_ANY ────────
                .requestMatchers(HttpMethod.PATCH, "/posts/*/pin")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER")

                // ── COMMENT_VIEW — read comments (every authenticated user) ────
                .requestMatchers(HttpMethod.GET, "/posts/*/comments/**").authenticated()

                // ── COMMENT_CREATE / COMMENT_EDIT_OWN ────────────────────────
                .requestMatchers(HttpMethod.POST, "/posts/*/comments")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")
                .requestMatchers(HttpMethod.PUT, "/posts/*/comments/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── COMMENT_DELETE_OWN / COMMENT_DELETE_ANY ──────────────────
                //    HR, Dept Leader, and CEO may delete any comment (moderation).
                //    Everyone else can only delete their own (enforced in service).
                .requestMatchers(HttpMethod.DELETE, "/posts/*/comments/**")
                    .hasAnyRole("CEO", "HUMAN_RESOURCES", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── POST_REACT / COMMENT_REACT — reactions (every authenticated user)
                .requestMatchers("/posts/*/reactions/**").authenticated()
                .requestMatchers("/posts/*/comments/*/reactions/**").authenticated()

                // ── ATTACHMENT_VIEW — view attachments (every authenticated user)
                .requestMatchers(HttpMethod.GET, "/posts/*/attachments/**").authenticated()

                // ── ATTACHMENT_UPLOAD / ATTACHMENT_DELETE_OWN ────────────────
                .requestMatchers(HttpMethod.POST, "/posts/*/attachments")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")
                .requestMatchers(HttpMethod.DELETE, "/posts/*/attachments/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER", "TEAM_MEMBER", "EMPLOYEE")

                // ── SURVEY_VOTE — vote on a survey (every authenticated user) ─
                .requestMatchers(HttpMethod.POST, "/posts/*/survey/vote").authenticated()

                // ── Fallback ──────────────────────────────────────────────────
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
