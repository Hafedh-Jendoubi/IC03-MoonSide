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

/**
 * Organization-Service security configuration.
 *
 * ── Strategy ──────────────────────────────────────────────────────────────────
 * All requests require a valid JWT.  Access rules are enforced via hasRole().
 * The role names below must stay in sync with the roles seeded in
 * User-Service DataSeeder.
 *
 * ── Permission → endpoint mapping ────────────────────────────────────────────
 *   TEAM_VIEW            GET  /organizations/teams/**
 *   TEAM_FOLLOW          POST/DELETE /organizations/teams/{id}/follow
 *   TEAM_EDIT            PUT/PATCH /organizations/teams/{id}
 *   TEAM_ADD_MEMBER      POST /organizations/teams/{id}/members
 *   TEAM_REMOVE_MEMBER   DELETE /organizations/teams/{id}/members
 *   TEAM_ASSIGN_MEMBER   POST /organizations/teams/{id}/assign/{userId}
 *   DEPT_VIEW            GET  /organizations/departments/**
 *   DEPT_FOLLOW          POST/DELETE /organizations/departments/{id}/follow
 *   DEPT_EDIT            PUT /organizations/departments/{id}
 *   DEPT_CREATE_TEAM     POST /organizations/departments/{id}/teams
 *   DEPT_CHANGE_MANAGER  PATCH /organizations/departments/{id}/manager
 *   PROJECT_VIEW         GET  /organizations/projects/**
 *   PROJECT_CREATE_TEAM  POST /organizations/teams/{id}/projects
 *   PROJECT_CREATE_DEPT  POST /organizations/departments/{id}/projects
 *   PROJECT_EDIT         PUT  /organizations/projects/**   (CEO only)
 *   PROJECT_DELETE       DELETE /organizations/projects/** (CEO only)
 *   ORG_MANAGE           POST/DELETE /organizations/departments/** (CEO only)
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

                // ── Actuator ──────────────────────────────────────────────────
                .requestMatchers("/actuator/health", "/actuator/info", "/actuator/prometheus").permitAll()

                // ── TEAM_VIEW — browse teams (every authenticated user) ────────
                .requestMatchers(HttpMethod.GET, "/organizations/teams/public").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/independent").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/visible").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/search").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/{teamId}").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/{teamId}/members").authenticated()
                .requestMatchers(HttpMethod.GET, "/organizations/teams/{teamId}/projects").authenticated()

                // ── Self-service team membership ──────────────────────────────
                .requestMatchers(HttpMethod.POST,   "/organizations/teams/{teamId}/join").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/organizations/teams/{teamId}/leave").authenticated()
                .requestMatchers(HttpMethod.GET,    "/organizations/teams/my").authenticated()

                // ── TEAM_FOLLOW — follow/unfollow a team (every authenticated user)
                .requestMatchers(HttpMethod.POST,   "/organizations/teams/{teamId}/follow").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/organizations/teams/{teamId}/follow").authenticated()

                // ── DEPT_VIEW — browse departments (every authenticated user) ──
                .requestMatchers(HttpMethod.GET, "/organizations/departments/**").authenticated()

                // ── DEPT_FOLLOW — follow/unfollow a department (every authenticated user)
                .requestMatchers(HttpMethod.POST,   "/organizations/departments/{id}/follow").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/organizations/departments/{id}/follow").authenticated()

                // ── PROJECT_VIEW — browse projects (every authenticated user) ──
                .requestMatchers(HttpMethod.GET, "/organizations/projects/**").authenticated()

                // ── TEAM_ASSIGN_MEMBER — assign a user to a team ─────────────
                //    Granted to: Team Leader, Department Leader, HR, CEO
                .requestMatchers(HttpMethod.POST, "/organizations/teams/{teamId}/assign/{userId}")
                    .hasAnyRole("CEO", "TEAM_LEADER", "DEPARTMENT_LEADER", "HUMAN_RESOURCES")

                // ── PROJECT_CREATE_TEAM — create a project under a team ───────
                //    Granted to: Team Leader, Department Leader, CEO
                .requestMatchers(HttpMethod.POST, "/organizations/teams/{teamId}/projects")
                    .hasAnyRole("CEO", "TEAM_LEADER", "DEPARTMENT_LEADER")

                // ── PROJECT_CREATE_DEPT — create a project under a department ─
                //    Granted to: Department Leader, CEO
                .requestMatchers(HttpMethod.POST, "/organizations/departments/{deptId}/projects")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER")

                // ── ORG_MANAGE — create / delete departments (CEO only) ───────
                .requestMatchers(HttpMethod.POST,   "/organizations/departments/**").hasRole("CEO")
                .requestMatchers(HttpMethod.DELETE, "/organizations/departments/**").hasRole("CEO")

                // ── DEPT_CHANGE_MANAGER — reassign department manager ─────────
                //    PATCH /departments/{id}/manager: Dept Leader or CEO
                // ── DEPT_EDIT — edit department details ───────────────────────
                //    PUT /departments/{id}: Dept Leader or CEO
                .requestMatchers(HttpMethod.PATCH, "/organizations/departments/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER")
                .requestMatchers(HttpMethod.PUT,   "/organizations/departments/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER")

                // ── PROJECT_ASSIGN_MEMBER — assign/unassign users to projects ──
                //    CEO, TEAM_LEADER, DEPARTMENT_LEADER (service enforces team membership)
                .requestMatchers(HttpMethod.POST,
                        "/organizations/projects/*/members/*")
                    .hasAnyRole("CEO", "TEAM_LEADER", "DEPARTMENT_LEADER")
                .requestMatchers(HttpMethod.DELETE,
                        "/organizations/projects/*/members/*")
                    .hasAnyRole("CEO", "TEAM_LEADER", "DEPARTMENT_LEADER")

                // ── PROJECT_EDIT / PROJECT_DELETE (CEO only) ──────────────────
                .requestMatchers(HttpMethod.POST,   "/organizations/projects").hasRole("CEO")
                .requestMatchers(HttpMethod.PUT,    "/organizations/projects/**").hasRole("CEO")
                .requestMatchers(HttpMethod.DELETE, "/organizations/projects/**").hasRole("CEO")

                // ── Create a new team ─────────────────────────────────────────
                //    CEO, Department Leader, HR can create top-level teams
                .requestMatchers(HttpMethod.POST, "/organizations/teams")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "HUMAN_RESOURCES")

                // ── Delete a team (CEO or Department Leader) ──────────────────
                .requestMatchers(HttpMethod.DELETE, "/organizations/teams/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER")

                // ── TEAM_EDIT — edit team details ─────────────────────────────
                //    PATCH/PUT /teams/{id}: Team Leader, Dept Leader, CEO
                // ── TEAM_CHANGE_LEAD / TEAM_ADD_MEMBER / TEAM_REMOVE_MEMBER ───
                //    All covered by PATCH/PUT on teams
                .requestMatchers(HttpMethod.PATCH, "/organizations/teams/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER")
                .requestMatchers(HttpMethod.PUT,   "/organizations/teams/**")
                    .hasAnyRole("CEO", "DEPARTMENT_LEADER", "TEAM_LEADER")

                // ── Fallback ──────────────────────────────────────────────────
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
