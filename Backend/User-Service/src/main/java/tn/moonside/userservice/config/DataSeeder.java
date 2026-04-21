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
 * Seeds the database with the 5 canonical roles and their ADDITIVE, non-overlapping permissions.
 *
 * ROLE HIERARCHY (additive — assign multiple roles to a user to combine permissions)
 * ─────────────────────────────────────────────────────────────────────────────────
 *
 *  EMPLOYEE          — Login + view everything (non-back-office) + own profile update
 *  TEAM_LEADER       — Manage own team details, members, and lead assignment
 *  DEPARTMENT_LEADER — Manage own department details, teams inside it, and dept manager
 *  HUMAN_RESOURCES   — Back-office dashboard (read) + user list + single invite + org read
 *  CEO               — Unrestricted via ANYTHING wildcard
 *
 *  No permission appears in more than one role.
 *  To get Team Leader capabilities on top of Employee, assign BOTH roles.
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

    // ─── Roles ────────────────────────────────────────────────────────────────

    private void seedRoles() {
        List<RoleDef> roles = List.of(
            new RoleDef("EMPLOYEE",          "Default role — every user. Login, view content, manage own profile."),
            new RoleDef("TEAM_LEADER",       "Manage everything within own team (details, members, lead)."),
            new RoleDef("DEPARTMENT_LEADER", "Manage own department and teams within it; inherits Team Leader authorities for dept teams."),
            new RoleDef("HUMAN_RESOURCES",   "Limited back-office access: dashboard, user list, single invite, organizations."),
            new RoleDef("CEO",               "Unrestricted access to everything via ANYTHING wildcard.")
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

    // ─── Permissions ──────────────────────────────────────────────────────────

    private void seedPermissions() {
        List<PermissionDef> defs = List.of(

            // ── CEO wildcard ──────────────────────────────────────────────────
            new PermissionDef(AppPermission.ANYTHING,                  TypeScope.GLOBAL, "Unrestricted — granted only to CEO"),

            // ── Own profile (EMPLOYEE) ────────────────────────────────────────
            new PermissionDef(AppPermission.USER_READ_OWN,             TypeScope.OWN,    "Read own profile"),
            new PermissionDef(AppPermission.USER_UPDATE_OWN,           TypeScope.OWN,    "Update own profile fields"),
            new PermissionDef(AppPermission.USER_UPDATE_OWN_AVATAR,    TypeScope.OWN,    "Update own avatar"),
            new PermissionDef(AppPermission.USER_DELETE_OWN_AVATAR,    TypeScope.OWN,    "Delete own avatar"),

            // ── View content (EMPLOYEE) ───────────────────────────────────────
            new PermissionDef(AppPermission.USER_READ,                 TypeScope.GLOBAL, "View any user profile"),
            new PermissionDef(AppPermission.USER_READ_ROLES,           TypeScope.GLOBAL, "View a user's assigned roles"),

            // ── Team management (TEAM_LEADER) ─────────────────────────────────
            new PermissionDef(AppPermission.TEAM_MANAGE,               TypeScope.TEAM,   "Manage own team details"),
            new PermissionDef(AppPermission.TEAM_MANAGE_MEMBERS,       TypeScope.TEAM,   "Add/remove members from own team"),
            new PermissionDef(AppPermission.TEAM_MANAGE_LEAD,          TypeScope.TEAM,   "Assign/change team lead within own team"),

            // ── Department management (DEPARTMENT_LEADER) ─────────────────────
            new PermissionDef(AppPermission.DEPT_MANAGE,               TypeScope.DEPARTMENT, "Manage own department details"),
            new PermissionDef(AppPermission.DEPT_MANAGE_TEAMS,         TypeScope.DEPARTMENT, "Create/manage teams within own department"),
            new PermissionDef(AppPermission.DEPT_MANAGE_MANAGER,       TypeScope.DEPARTMENT, "Assign/change department manager"),

            // ── HR back-office (HUMAN_RESOURCES) ─────────────────────────────
            new PermissionDef(AppPermission.BACKOFFICE_DASHBOARD_READ, TypeScope.GLOBAL, "Read back-office dashboard analytics"),
            new PermissionDef(AppPermission.USER_READ_ALL,             TypeScope.GLOBAL, "List all users in back office"),
            new PermissionDef(AppPermission.USER_INVITE,               TypeScope.GLOBAL, "Invite a single user"),
            new PermissionDef(AppPermission.ORG_READ,                  TypeScope.GLOBAL, "Read organizations in back office"),

            // ── CEO-only full-admin (accessed via ANYTHING but defined for completeness) ─
            new PermissionDef(AppPermission.USER_INVITE_BULK,          TypeScope.GLOBAL, "Bulk invite users from Excel"),
            new PermissionDef(AppPermission.USER_UPDATE,               TypeScope.GLOBAL, "Update any user"),
            new PermissionDef(AppPermission.USER_DELETE,               TypeScope.GLOBAL, "Delete any user"),
            new PermissionDef(AppPermission.USER_DEACTIVATE,           TypeScope.GLOBAL, "Deactivate a user"),
            new PermissionDef(AppPermission.USER_ACTIVATE,             TypeScope.GLOBAL, "Activate a user"),
            new PermissionDef(AppPermission.USER_ASSIGN_ROLE,          TypeScope.GLOBAL, "Assign a role to a user"),
            new PermissionDef(AppPermission.USER_REVOKE_ROLE,          TypeScope.GLOBAL, "Revoke a role from a user"),
            new PermissionDef(AppPermission.ROLE_CREATE,               TypeScope.GLOBAL, "Create a new role"),
            new PermissionDef(AppPermission.ROLE_READ_ALL,             TypeScope.GLOBAL, "List all roles"),
            new PermissionDef(AppPermission.ROLE_READ,                 TypeScope.GLOBAL, "Read a specific role"),
            new PermissionDef(AppPermission.ROLE_UPDATE,               TypeScope.GLOBAL, "Update a role"),
            new PermissionDef(AppPermission.ROLE_DELETE,               TypeScope.GLOBAL, "Delete a role"),
            new PermissionDef(AppPermission.ROLE_ASSIGN_PERMISSION,    TypeScope.GLOBAL, "Assign a permission to a role"),
            new PermissionDef(AppPermission.ROLE_REVOKE_PERMISSION,    TypeScope.GLOBAL, "Revoke a permission from a role"),
            new PermissionDef(AppPermission.PERMISSION_CREATE,         TypeScope.GLOBAL, "Create a permission"),
            new PermissionDef(AppPermission.PERMISSION_READ_ALL,       TypeScope.GLOBAL, "List all permissions"),
            new PermissionDef(AppPermission.PERMISSION_READ,           TypeScope.GLOBAL, "Read a specific permission"),
            new PermissionDef(AppPermission.PERMISSION_UPDATE,         TypeScope.GLOBAL, "Update a permission"),
            new PermissionDef(AppPermission.PERMISSION_DELETE,         TypeScope.GLOBAL, "Delete a permission"),
            new PermissionDef(AppPermission.AUDIT_LOG_READ,            TypeScope.GLOBAL, "Query audit logs"),
            new PermissionDef(AppPermission.AUDIT_LOG_STATS,           TypeScope.GLOBAL, "View audit log statistics"),
            new PermissionDef(AppPermission.ORG_MANAGE,                TypeScope.GLOBAL, "Full organization management"),
            new PermissionDef(AppPermission.BACKOFFICE_FULL,           TypeScope.GLOBAL, "Full back-office access (roles, settings, audit)")
        );

        defs.forEach(def -> {
            if (!permissionRepository.existsByActionAndScopeType(def.action(), def.scopeType())) {
                permissionRepository.save(Permission.builder()
                        .action(def.action())
                        .scopeType(def.scopeType())
                        .description(def.description())
                        .build());
                log.info("Seeded permission: {} [{}]", def.action(), def.scopeType());
            }
        });
    }

    // ─── Default role ↔ permission assignments ────────────────────────────────

    private void seedDefaultRolePermissions() {

        // ── EMPLOYEE — own profile + view everything (no back office) ──────────
        List<String> employeePerms = List.of(
            AppPermission.USER_READ_OWN,
            AppPermission.USER_UPDATE_OWN,
            AppPermission.USER_UPDATE_OWN_AVATAR,
            AppPermission.USER_DELETE_OWN_AVATAR,
            AppPermission.USER_READ,
            AppPermission.USER_READ_ROLES
        );

        // ── TEAM_LEADER — team-scoped management only (no overlap with EMPLOYEE) ─
        List<String> teamLeaderPerms = List.of(
            AppPermission.TEAM_MANAGE,
            AppPermission.TEAM_MANAGE_MEMBERS,
            AppPermission.TEAM_MANAGE_LEAD
        );

        // ── DEPARTMENT_LEADER — dept-scoped management (no overlap with TEAM_LEADER) ─
        List<String> departmentLeaderPerms = List.of(
            AppPermission.DEPT_MANAGE,
            AppPermission.DEPT_MANAGE_TEAMS,
            AppPermission.DEPT_MANAGE_MANAGER
        );

        // ── HUMAN_RESOURCES — limited back-office (no overlap with above roles) ─
        List<String> hrPerms = List.of(
            AppPermission.BACKOFFICE_DASHBOARD_READ,
            AppPermission.USER_READ_ALL,
            AppPermission.USER_INVITE,
            AppPermission.ORG_READ
        );

        // ── CEO — single ANYTHING wildcard (everything else is a subset) ────────
        List<String> ceoPerms = List.of(
            AppPermission.ANYTHING
        );

        Map<String, List<String>> rolePermissionMap = Map.of(
            "EMPLOYEE",          employeePerms,
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
                        log.info("Assigned permission '{}' to role '{}'", action, roleName);
                    }
                });
            });
        });
    }

    // ─── Internal records ──────────────────────────────────────────────────────

    private record PermissionDef(String action, TypeScope scopeType, String description) {}
    private record RoleDef(String name, String description) {}
}
