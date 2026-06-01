package tn.moonside.userservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import tn.moonside.userservice.entities.Permission;
import tn.moonside.userservice.entities.PermissionRole;
import tn.moonside.userservice.entities.Role;
import tn.moonside.userservice.entities.TypeScope;
import tn.moonside.userservice.repositories.PermissionRepository;
import tn.moonside.userservice.repositories.PermissionRoleRepository;
import tn.moonside.userservice.repositories.RoleRepository;
import tn.moonside.userservice.security.AppPermission;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Seeds the database with the 6 canonical roles and their permissions.
 *
 * ── Role overview ─────────────────────────────────────────────────────────────
 *
 *   EMPLOYEE          Every user gets this automatically.
 *                     → Own profile management, browse directory & org chart,
 *                       read / create / react / comment on posts.
 *
 *   TEAM_MEMBER       Assigned when a user is added to a team.
 *                     → Same permissions as EMPLOYEE (separate role for clarity
 *                       and future differentiation).
 *
 *   TEAM_LEADER       Assigned to the lead of a specific team.
 *                     → Manage own team: edit details, add/remove members,
 *                       change team lead, pin posts inside the team's feed.
 *
 *   DEPARTMENT_LEADER Assigned to the head of a department.
 *                     → Manage own department: edit details, create teams,
 *                       change department manager, pin posts in the dept feed,
 *                       moderate (delete) any comment in the department.
 *
 *   HUMAN_RESOURCES   Back-office staff.
 *                     → Dashboard analytics, user directory & single invite,
 *                       assign members to teams, read org data & post feeds,
 *                       moderate (delete) any post or comment.
 *
 *   CEO               Unrestricted via the ANYTHING wildcard.
 *
 * ── Multi-role design ─────────────────────────────────────────────────────────
 *   Roles are ADDITIVE.  A user with [EMPLOYEE, TEAM_LEADER] holds the union
 *   of both permission sets.  There is intentional overlap between EMPLOYEE and
 *   TEAM_MEMBER so that either role alone gives full interactive access.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository           roleRepository;
    private final PermissionRepository     permissionRepository;
    private final PermissionRoleRepository permissionRoleRepository;

    @Override
    public void run(String... args) {
        seedRoles();
        seedPermissions();
        seedDefaultRolePermissions();
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    private void seedRoles() {
        List<RoleDef> roles = List.of(
            new RoleDef("EMPLOYEE",
                "Default role for every user. Own profile management, browse directory and org chart, full post interaction."),
            new RoleDef("TEAM_MEMBER",
                "Granted when a user is added to a team. Same interactive rights as EMPLOYEE."),
            new RoleDef("TEAM_LEADER",
                "Manages own team: members, details, lead assignment, and team-scoped post pinning."),
            new RoleDef("DEPARTMENT_LEADER",
                "Manages own department and its teams. Can pin posts in department feed and moderate comments."),
            new RoleDef("HUMAN_RESOURCES",
                "Back-office access: analytics dashboard, user directory, single invite, org data, post/comment moderation."),
            new RoleDef("CEO",
                "Unrestricted access to everything via the ANYTHING wildcard.")
        );

        roles.forEach(def -> {
            if (!roleRepository.existsByName(def.name())) {
                roleRepository.save(Role.builder()
                        .name(def.name())
                        .description(def.description())
                        .build());
                log.info("Seeded role: {}", def.name());
            }
        });
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    private void seedPermissions() {
        List<PermissionDef> defs = List.of(

            // ── CEO wildcard ──────────────────────────────────────────────────
            perm(AppPermission.ANYTHING,
                "Unrestricted access — granted only to the CEO role"),

            // ── Own profile (EMPLOYEE) ────────────────────────────────────────
            perm(AppPermission.USER_VIEW_OWN,
                "GET /users/me — view own profile"),
            perm(AppPermission.USER_EDIT_OWN,
                "PUT /users/me — edit own profile fields"),
            perm(AppPermission.USER_EDIT_OWN_AVATAR,
                "PATCH /users/me/avatar — upload or change own avatar"),
            perm(AppPermission.USER_DELETE_OWN_AVATAR,
                "DELETE /users/me/avatar — remove own avatar"),

            // ── Viewing other users (EMPLOYEE) ────────────────────────────────
            perm(AppPermission.USER_VIEW,
                "GET /users/{id} — view any user's public profile"),
            perm(AppPermission.USER_VIEW_ALL,
                "GET /users — list all users (directory browsing)"),
            perm(AppPermission.USER_VIEW_ROLES,
                "GET /users/{id}/roles — view the roles assigned to a user"),

            // ── HR / admin user operations ────────────────────────────────────
            perm(AppPermission.USER_INVITE,
                "POST /users/invite — invite a single user by e-mail (HR)"),
            perm(AppPermission.USER_INVITE_BULK,
                "POST /users/invite/bulk — bulk-invite users from an Excel file (CEO)"),
            perm(AppPermission.USER_EDIT_ANY,
                "PUT /users/{id} — edit any user's profile (CEO)"),
            perm(AppPermission.USER_DELETE_ANY,
                "DELETE /users/{id} — permanently delete a user (CEO)"),
            perm(AppPermission.USER_DEACTIVATE,
                "PATCH /users/{id}/deactivate — suspend a user account (CEO)"),
            perm(AppPermission.USER_ACTIVATE,
                "PATCH /users/{id}/activate — re-enable a suspended account (CEO)"),

            // ── Role assignment ───────────────────────────────────────────────
            perm(AppPermission.USER_ASSIGN_ROLE,
                "POST /users/{id}/roles — assign a role to a user (CEO)"),
            perm(AppPermission.USER_REVOKE_ROLE,
                "DELETE /users/{id}/roles/{roleId} — revoke a role from a user (CEO)"),

            // ── Role & Permission management (CEO) ────────────────────────────
            perm(AppPermission.ROLE_CREATE,             "POST /roles — create a new role"),
            perm(AppPermission.ROLE_VIEW_ALL,           "GET /roles — list all roles"),
            perm(AppPermission.ROLE_VIEW,               "GET /roles/{id} — view a specific role"),
            perm(AppPermission.ROLE_EDIT,               "PUT /roles/{id} — rename or update a role"),
            perm(AppPermission.ROLE_DELETE,             "DELETE /roles/{id} — delete a role"),
            perm(AppPermission.ROLE_ASSIGN_PERMISSION,  "POST /roles/{id}/permissions/{pid} — attach a permission to a role"),
            perm(AppPermission.ROLE_REVOKE_PERMISSION,  "DELETE /roles/{id}/permissions/{pid} — detach a permission from a role"),
            perm(AppPermission.PERMISSION_CREATE,       "POST /permissions — create a permission definition"),
            perm(AppPermission.PERMISSION_VIEW_ALL,     "GET /permissions — list all permission definitions"),
            perm(AppPermission.PERMISSION_VIEW,         "GET /permissions/{id} — view a permission definition"),
            perm(AppPermission.PERMISSION_EDIT,         "PUT /permissions/{id} — update a permission definition"),
            perm(AppPermission.PERMISSION_DELETE,       "DELETE /permissions/{id} — delete a permission definition"),

            // ── Audit logs (CEO) ──────────────────────────────────────────────
            perm(AppPermission.AUDIT_LOG_VIEW,          "GET /audit-logs — query the audit log"),
            perm(AppPermission.AUDIT_LOG_VIEW_STATS,    "GET /audit-logs/stats — view aggregated audit statistics"),

            // ── Back-office access ────────────────────────────────────────────
            perm(AppPermission.BACKOFFICE_DASHBOARD_VIEW,
                "Read-only access to the back-office analytics dashboard (HR)"),
            perm(AppPermission.BACKOFFICE_FULL,
                "Full back-office access: settings, roles, audit pages (CEO)"),

            // ── Organization: Teams ───────────────────────────────────────────
            perm(AppPermission.TEAM_VIEW,
                "GET /organizations/teams/** — view team details, members, and projects"),
            perm(AppPermission.TEAM_EDIT,
                "PUT/PATCH /organizations/teams/{id} — edit team details (Team Leader, Dept Leader)"),
            perm(AppPermission.TEAM_ADD_MEMBER,
                "POST /organizations/teams/{id}/members — add a member to a team"),
            perm(AppPermission.TEAM_REMOVE_MEMBER,
                "DELETE /organizations/teams/{id}/members — remove a member from a team"),
            perm(AppPermission.TEAM_ASSIGN_MEMBER,
                "POST /organizations/teams/{id}/assign/{userId} — assign a user as a team member (HR / leaders)"),
            perm(AppPermission.TEAM_CHANGE_LEAD,
                "PATCH /organizations/teams/{id}/lead — change who leads a team"),
            perm(AppPermission.TEAM_FOLLOW,
                "POST/DELETE /organizations/teams/{id}/follow — subscribe or unsubscribe from team updates"),

            // ── Organization: Departments ─────────────────────────────────────
            perm(AppPermission.DEPT_VIEW,
                "GET /organizations/departments/** — view department details"),
            perm(AppPermission.DEPT_EDIT,
                "PUT /organizations/departments/{id} — edit department details (Dept Leader)"),
            perm(AppPermission.DEPT_CREATE_TEAM,
                "POST /organizations/departments/{id}/teams — create a new team inside a department (Dept Leader)"),
            perm(AppPermission.DEPT_CHANGE_MANAGER,
                "PATCH /organizations/departments/{id}/manager — reassign the department manager (Dept Leader)"),
            perm(AppPermission.DEPT_FOLLOW,
                "POST/DELETE /organizations/departments/{id}/follow — subscribe or unsubscribe from department updates"),

            // ── Organization: Projects ────────────────────────────────────────
            perm(AppPermission.PROJECT_VIEW,
                "GET /organizations/projects/** — view projects"),
            perm(AppPermission.PROJECT_CREATE_TEAM,
                "POST /organizations/teams/{teamId}/projects — create a project under a team (Team Leader +)"),
            perm(AppPermission.PROJECT_CREATE_DEPT,
                "POST /organizations/departments/{deptId}/projects — create a project under a department (Dept Leader +)"),
            perm(AppPermission.PROJECT_EDIT,
                "PUT /organizations/projects/{id} — edit a project (CEO)"),
            perm(AppPermission.PROJECT_DELETE,
                "DELETE /organizations/projects/{id} — delete a project (CEO)"),
            perm(AppPermission.ORG_VIEW,
                "GET /organizations — list all organizations in back-office (HR)"),
            perm(AppPermission.ORG_MANAGE,
                "Full organization management: create/delete departments and organizations (CEO)"),

            // ── Post-Service: Posts ───────────────────────────────────────────
            perm(AppPermission.POST_VIEW,
                "GET /posts/feed, /posts/{id}, /posts/author/**, /posts/team/**, /posts/department/**"),
            perm(AppPermission.POST_CREATE,
                "POST /posts — create a post"),
            perm(AppPermission.POST_EDIT_OWN,
                "PUT /posts/{id} — edit own post (ownership enforced in service)"),
            perm(AppPermission.POST_DELETE_OWN,
                "DELETE /posts/{id} — delete own post (ownership enforced in service)"),
            perm(AppPermission.POST_DELETE_ANY,
                "DELETE /posts/{id} — delete any post for moderation (HR / CEO)"),
            perm(AppPermission.POST_PIN_IN_TEAM,
                "PATCH /posts/{id}/pin — pin or unpin a post in own team's feed (Team Leader)"),
            perm(AppPermission.POST_PIN_IN_DEPT,
                "PATCH /posts/{id}/pin — pin or unpin a post in own department's feed (Dept Leader)"),
            perm(AppPermission.POST_PIN_ANY,
                "PATCH /posts/{id}/pin — pin or unpin any post (CEO only)"),
            perm(AppPermission.POST_SAVE,
                "GET/POST/DELETE /posts/saved/** — bookmark or unbookmark posts"),

            // ── Post-Service: Comments ────────────────────────────────────────
            perm(AppPermission.COMMENT_VIEW,
                "GET /posts/{id}/comments — view comments and replies"),
            perm(AppPermission.COMMENT_CREATE,
                "POST /posts/{id}/comments — add a comment"),
            perm(AppPermission.COMMENT_EDIT_OWN,
                "PUT /posts/{id}/comments/{cid} — edit own comment"),
            perm(AppPermission.COMMENT_DELETE_OWN,
                "DELETE /posts/{id}/comments/{cid} — delete own comment"),
            perm(AppPermission.COMMENT_DELETE_ANY,
                "DELETE /posts/{id}/comments/{cid} — delete any comment for moderation (Dept Leader, HR, CEO)"),

            // ── Post-Service: Reactions ───────────────────────────────────────
            perm(AppPermission.POST_REACT,
                "POST/GET /posts/{id}/reactions — react to a post or view its reactions"),
            perm(AppPermission.COMMENT_REACT,
                "POST/GET /posts/{id}/comments/{cid}/reactions — react to a comment or view its reactions"),
            perm(AppPermission.REACTION_TYPE_VIEW,
                "GET /reaction-types — list available emoji reaction types"),
            perm(AppPermission.REACTION_TYPE_CREATE,
                "POST /reaction-types — add a new reaction type (CEO only)"),
            perm(AppPermission.REACTION_TYPE_DELETE,
                "DELETE /reaction-types/{id} — remove a reaction type (CEO only)"),

            // ── Post-Service: Attachments ─────────────────────────────────────
            perm(AppPermission.ATTACHMENT_VIEW,
                "GET /posts/{id}/attachments — view file attachments on a post"),
            perm(AppPermission.ATTACHMENT_UPLOAD,
                "POST /posts/{id}/attachments — upload a file attachment to a post"),
            perm(AppPermission.ATTACHMENT_DELETE_OWN,
                "DELETE /posts/{id}/attachments/{aid} — delete own attachment"),

            // ── Post-Service: Surveys ─────────────────────────────────────────
            perm(AppPermission.SURVEY_VOTE,
                "POST /posts/{id}/survey/vote — cast or change a vote on a survey post")
        );

        defs.forEach(def -> {
            if (!permissionRepository.existsByAction(def.action())) {
                permissionRepository.save(Permission.builder()
                        .action(def.action())
                        .scopeType(TypeScope.GLOBAL)   // scope is encoded in the name; DB field kept for compatibility
                        .description(def.description())
                        .build());
                log.info("Seeded permission: {}", def.action());
            }
        });
    }

    // ── Default role ↔ permission assignments ─────────────────────────────────

    private void seedDefaultRolePermissions() {

        // ── EMPLOYEE ──────────────────────────────────────────────────────────
        // Own profile · browse directory & org chart · full post interaction
        List<String> employeePerms = List.of(
            // Own profile
            AppPermission.USER_VIEW_OWN,
            AppPermission.USER_EDIT_OWN,
            AppPermission.USER_EDIT_OWN_AVATAR,
            AppPermission.USER_DELETE_OWN_AVATAR,
            // Browse other users & roles
            AppPermission.USER_VIEW,
            AppPermission.USER_VIEW_ALL,
            AppPermission.USER_VIEW_ROLES,
            // Browse org
            AppPermission.TEAM_VIEW,
            AppPermission.TEAM_FOLLOW,
            AppPermission.DEPT_VIEW,
            AppPermission.DEPT_FOLLOW,
            AppPermission.PROJECT_VIEW,
            // Post interaction
            AppPermission.POST_VIEW,
            AppPermission.POST_CREATE,
            AppPermission.POST_EDIT_OWN,
            AppPermission.POST_DELETE_OWN,
            AppPermission.POST_SAVE,
            AppPermission.COMMENT_VIEW,
            AppPermission.COMMENT_CREATE,
            AppPermission.COMMENT_EDIT_OWN,
            AppPermission.COMMENT_DELETE_OWN,
            AppPermission.POST_REACT,
            AppPermission.COMMENT_REACT,
            AppPermission.REACTION_TYPE_VIEW,
            AppPermission.ATTACHMENT_VIEW,
            AppPermission.ATTACHMENT_UPLOAD,
            AppPermission.ATTACHMENT_DELETE_OWN,
            AppPermission.SURVEY_VOTE
        );

        // ── TEAM_MEMBER ────────────────────────────────────────────────────────
        // Identical to EMPLOYEE — kept as a separate role for future differentiation
        // and to signal membership in a specific team.
        List<String> teamMemberPerms = List.of(
            AppPermission.USER_VIEW_OWN,
            AppPermission.USER_EDIT_OWN,
            AppPermission.USER_EDIT_OWN_AVATAR,
            AppPermission.USER_DELETE_OWN_AVATAR,
            AppPermission.USER_VIEW,
            AppPermission.USER_VIEW_ALL,
            AppPermission.USER_VIEW_ROLES,
            AppPermission.TEAM_VIEW,
            AppPermission.TEAM_FOLLOW,
            AppPermission.DEPT_VIEW,
            AppPermission.DEPT_FOLLOW,
            AppPermission.PROJECT_VIEW,
            AppPermission.POST_VIEW,
            AppPermission.POST_CREATE,
            AppPermission.POST_EDIT_OWN,
            AppPermission.POST_DELETE_OWN,
            AppPermission.POST_SAVE,
            AppPermission.COMMENT_VIEW,
            AppPermission.COMMENT_CREATE,
            AppPermission.COMMENT_EDIT_OWN,
            AppPermission.COMMENT_DELETE_OWN,
            AppPermission.POST_REACT,
            AppPermission.COMMENT_REACT,
            AppPermission.REACTION_TYPE_VIEW,
            AppPermission.ATTACHMENT_VIEW,
            AppPermission.ATTACHMENT_UPLOAD,
            AppPermission.ATTACHMENT_DELETE_OWN,
            AppPermission.SURVEY_VOTE
        );

        // ── TEAM_LEADER ────────────────────────────────────────────────────────
        // Manage own team + pin posts in team feed.
        // Assign EMPLOYEE + TEAM_LEADER together for full interactive + leadership access.
        List<String> teamLeaderPerms = List.of(
            AppPermission.TEAM_EDIT,
            AppPermission.TEAM_ADD_MEMBER,
            AppPermission.TEAM_REMOVE_MEMBER,
            AppPermission.TEAM_ASSIGN_MEMBER,
            AppPermission.TEAM_CHANGE_LEAD,
            AppPermission.PROJECT_CREATE_TEAM,
            AppPermission.ROLE_VIEW_ALL,
            AppPermission.ROLE_VIEW,
            AppPermission.POST_PIN_IN_TEAM
        );

        // ── DEPARTMENT_LEADER ──────────────────────────────────────────────────
        // Manage own department + moderate comments.
        // Assign EMPLOYEE + TEAM_LEADER + DEPARTMENT_LEADER for full access.
        List<String> departmentLeaderPerms = List.of(
            AppPermission.DEPT_EDIT,
            AppPermission.DEPT_CREATE_TEAM,
            AppPermission.DEPT_CHANGE_MANAGER,
            AppPermission.TEAM_ASSIGN_MEMBER,
            AppPermission.PROJECT_CREATE_DEPT,
            AppPermission.POST_PIN_IN_DEPT,
            AppPermission.COMMENT_DELETE_ANY
        );

        // ── HUMAN_RESOURCES ────────────────────────────────────────────────────
        // Back-office read access + single invite + moderation.
        List<String> hrPerms = List.of(
            AppPermission.BACKOFFICE_DASHBOARD_VIEW,
            AppPermission.USER_VIEW_ALL,
            AppPermission.USER_VIEW_ROLES,
            AppPermission.USER_INVITE,
            AppPermission.ROLE_VIEW_ALL,
            AppPermission.ORG_VIEW,
            AppPermission.TEAM_ASSIGN_MEMBER,
            // Post feeds — read only
            AppPermission.POST_VIEW,
            AppPermission.COMMENT_VIEW,
            AppPermission.REACTION_TYPE_VIEW,
            AppPermission.ATTACHMENT_VIEW,
            // Moderation
            AppPermission.POST_DELETE_ANY,
            AppPermission.COMMENT_DELETE_ANY
        );

        // ── CEO ────────────────────────────────────────────────────────────────
        List<String> ceoPerms = List.of(
            AppPermission.ANYTHING
        );

        Map<String, List<String>> rolePermissionMap = Map.of(
            "EMPLOYEE",          employeePerms,
            "TEAM_MEMBER",       teamMemberPerms,
            "TEAM_LEADER",       teamLeaderPerms,
            "DEPARTMENT_LEADER", departmentLeaderPerms,
            "HUMAN_RESOURCES",   hrPerms,
            "CEO",               ceoPerms
        );

        rolePermissionMap.forEach((roleName, permActions) -> {
            Optional<Role> roleOpt = roleRepository.findByName(roleName);
            if (roleOpt.isEmpty()) {
                log.warn("Role '{}' not found during permission seeding — skipping", roleName);
                return;
            }
            Role role = roleOpt.get();

            permActions.forEach(action -> {
                permissionRepository.findByAction(action).stream().findFirst().ifPresent(permission -> {
                    if (!permissionRoleRepository.existsByRoleIdAndPermissionId(role.getId(), permission.getId())) {
                        permissionRoleRepository.save(PermissionRole.builder()
                                .roleId(role.getId())
                                .permissionId(permission.getId())
                                .build());
                        log.info("Assigned '{}' → role '{}'", action, roleName);
                    }
                });
            });
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Shorthand: creates a GLOBAL-scoped PermissionDef (scope is encoded in the name). */
    private static PermissionDef perm(String action, String description) {
        return new PermissionDef(action, TypeScope.GLOBAL, description);
    }

    private record PermissionDef(String action, TypeScope scopeType, String description) {}
    private record RoleDef(String name, String description) {}
}
