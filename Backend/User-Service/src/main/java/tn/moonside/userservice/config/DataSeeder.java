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
 * Seeds the database with default roles and permissions on startup.
 *
 * Default permission → role assignments
 * ──────────────────────────────────────
 *  ADMIN           — ALL permissions (full access)
 *  MANAGER         — read users/roles/permissions + update users + audit logs
 *  DEPARTMENT_MANAGER — read/update users in their department scope
 *  TEAM_LEADER     — read users (team scope)
 *  EMPLOYEE        — own profile read/write only
 *  GUEST           — own profile read only
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
        List<String> defaultRoles = List.of(
                "ADMIN", "MANAGER", "EMPLOYEE", "GUEST",
                "DEPARTMENT_MANAGER", "TEAM_LEADER"
        );

        defaultRoles.forEach(roleName -> {
            if (!roleRepository.existsByName(roleName)) {
                roleRepository.save(Role.builder()
                        .name(roleName)
                        .description("Default " + roleName.toLowerCase().replace('_', ' ') + " role")
                        .build());
                log.info("Seeded role: {}", roleName);
            }
        });
    }

    // ─── Permissions ──────────────────────────────────────────────────────────

    /**
     * Each entry is: action, scopeType, description.
     * The action string must match a constant in {@link AppPermission}.
     */
    private void seedPermissions() {
        List<PermissionDef> defs = List.of(
            // Users
            new PermissionDef(AppPermission.USER_READ_ALL,           TypeScope.GLOBAL, "List all users"),
            new PermissionDef(AppPermission.USER_READ,               TypeScope.GLOBAL, "Read any user by ID"),
            new PermissionDef(AppPermission.USER_READ_OWN,           TypeScope.OWN,    "Read own profile"),
            new PermissionDef(AppPermission.USER_READ_ROLES,         TypeScope.GLOBAL, "View a user's assigned roles"),
            new PermissionDef(AppPermission.USER_UPDATE,             TypeScope.GLOBAL, "Update any user"),
            new PermissionDef(AppPermission.USER_UPDATE_OWN_AVATAR,  TypeScope.OWN,    "Update own avatar"),
            new PermissionDef(AppPermission.USER_DELETE_OWN_AVATAR,  TypeScope.OWN,    "Delete own avatar"),
            new PermissionDef(AppPermission.USER_DELETE,             TypeScope.GLOBAL, "Delete any user"),
            new PermissionDef(AppPermission.USER_DEACTIVATE,         TypeScope.GLOBAL, "Deactivate a user"),
            new PermissionDef(AppPermission.USER_ACTIVATE,           TypeScope.GLOBAL, "Activate a user"),
            new PermissionDef(AppPermission.USER_ASSIGN_ROLE,        TypeScope.GLOBAL, "Assign a role to a user"),
            new PermissionDef(AppPermission.USER_REVOKE_ROLE,        TypeScope.GLOBAL, "Revoke a role from a user"),
            new PermissionDef(AppPermission.USER_INVITE,             TypeScope.GLOBAL, "Invite a single user"),
            new PermissionDef(AppPermission.USER_INVITE_BULK,        TypeScope.GLOBAL, "Bulk invite users from Excel"),
            // Roles
            new PermissionDef(AppPermission.ROLE_CREATE,             TypeScope.GLOBAL, "Create a new role"),
            new PermissionDef(AppPermission.ROLE_READ_ALL,           TypeScope.GLOBAL, "List all roles"),
            new PermissionDef(AppPermission.ROLE_READ,               TypeScope.GLOBAL, "Read a specific role"),
            new PermissionDef(AppPermission.ROLE_UPDATE,             TypeScope.GLOBAL, "Update a role"),
            new PermissionDef(AppPermission.ROLE_DELETE,             TypeScope.GLOBAL, "Delete a role"),
            new PermissionDef(AppPermission.ROLE_ASSIGN_PERMISSION,  TypeScope.GLOBAL, "Assign a permission to a role"),
            new PermissionDef(AppPermission.ROLE_REVOKE_PERMISSION,  TypeScope.GLOBAL, "Revoke a permission from a role"),
            // Permissions
            new PermissionDef(AppPermission.PERMISSION_CREATE,       TypeScope.GLOBAL, "Create a permission"),
            new PermissionDef(AppPermission.PERMISSION_READ_ALL,     TypeScope.GLOBAL, "List all permissions"),
            new PermissionDef(AppPermission.PERMISSION_READ,         TypeScope.GLOBAL, "Read a specific permission"),
            new PermissionDef(AppPermission.PERMISSION_UPDATE,       TypeScope.GLOBAL, "Update a permission"),
            new PermissionDef(AppPermission.PERMISSION_DELETE,       TypeScope.GLOBAL, "Delete a permission"),
            // Audit logs
            new PermissionDef(AppPermission.AUDIT_LOG_READ,          TypeScope.GLOBAL, "Query audit logs"),
            new PermissionDef(AppPermission.AUDIT_LOG_STATS,         TypeScope.GLOBAL, "View audit log statistics")
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

        // ADMIN — all permissions
        List<String> adminPerms = List.of(
            AppPermission.USER_READ_ALL, AppPermission.USER_READ, AppPermission.USER_READ_OWN,
            AppPermission.USER_READ_ROLES, AppPermission.USER_UPDATE, AppPermission.USER_UPDATE_OWN_AVATAR,
            AppPermission.USER_DELETE_OWN_AVATAR, AppPermission.USER_DELETE, AppPermission.USER_DEACTIVATE,
            AppPermission.USER_ACTIVATE, AppPermission.USER_ASSIGN_ROLE, AppPermission.USER_REVOKE_ROLE,
            AppPermission.USER_INVITE, AppPermission.USER_INVITE_BULK,
            AppPermission.ROLE_CREATE, AppPermission.ROLE_READ_ALL, AppPermission.ROLE_READ,
            AppPermission.ROLE_UPDATE, AppPermission.ROLE_DELETE,
            AppPermission.ROLE_ASSIGN_PERMISSION, AppPermission.ROLE_REVOKE_PERMISSION,
            AppPermission.PERMISSION_CREATE, AppPermission.PERMISSION_READ_ALL, AppPermission.PERMISSION_READ,
            AppPermission.PERMISSION_UPDATE, AppPermission.PERMISSION_DELETE,
            AppPermission.AUDIT_LOG_READ, AppPermission.AUDIT_LOG_STATS
        );

        // MANAGER — read-heavy access + user update + audit
        List<String> managerPerms = List.of(
            AppPermission.USER_READ_ALL, AppPermission.USER_READ, AppPermission.USER_READ_OWN,
            AppPermission.USER_READ_ROLES, AppPermission.USER_UPDATE,
            AppPermission.USER_UPDATE_OWN_AVATAR, AppPermission.USER_DELETE_OWN_AVATAR,
            AppPermission.USER_INVITE,
            AppPermission.ROLE_READ_ALL, AppPermission.ROLE_READ,
            AppPermission.PERMISSION_READ_ALL, AppPermission.PERMISSION_READ,
            AppPermission.AUDIT_LOG_READ, AppPermission.AUDIT_LOG_STATS
        );

        // DEPARTMENT_MANAGER — department-scoped user management
        List<String> deptManagerPerms = List.of(
            AppPermission.USER_READ_ALL, AppPermission.USER_READ, AppPermission.USER_READ_OWN,
            AppPermission.USER_READ_ROLES, AppPermission.USER_UPDATE,
            AppPermission.USER_UPDATE_OWN_AVATAR, AppPermission.USER_DELETE_OWN_AVATAR,
            AppPermission.ROLE_READ_ALL, AppPermission.ROLE_READ
        );

        // TEAM_LEADER — read users, manage own profile
        List<String> teamLeaderPerms = List.of(
            AppPermission.USER_READ_ALL, AppPermission.USER_READ, AppPermission.USER_READ_OWN,
            AppPermission.USER_READ_ROLES,
            AppPermission.USER_UPDATE_OWN_AVATAR, AppPermission.USER_DELETE_OWN_AVATAR,
            AppPermission.ROLE_READ_ALL, AppPermission.ROLE_READ
        );

        // EMPLOYEE — own profile only
        List<String> employeePerms = List.of(
            AppPermission.USER_READ_OWN,
            AppPermission.USER_UPDATE_OWN_AVATAR,
            AppPermission.USER_DELETE_OWN_AVATAR
        );

        // GUEST — read own profile only
        List<String> guestPerms = List.of(
            AppPermission.USER_READ_OWN
        );

        Map<String, List<String>> rolePermissionMap = Map.of(
            "ADMIN",              adminPerms,
            "MANAGER",            managerPerms,
            "DEPARTMENT_MANAGER", deptManagerPerms,
            "TEAM_LEADER",        teamLeaderPerms,
            "EMPLOYEE",           employeePerms,
            "GUEST",              guestPerms
        );

        rolePermissionMap.forEach((roleName, permActions) -> {
            Optional<Role> roleOpt = roleRepository.findByName(roleName);
            if (roleOpt.isEmpty()) {
                log.warn("Role '{}' not found during permission seeding — skipping", roleName);
                return;
            }
            Role role = roleOpt.get();

            permActions.forEach(action -> {
                // Find the permission by action (GLOBAL scope for most; fall back to first match)
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

    // ─── Internal record ──────────────────────────────────────────────────────

    private record PermissionDef(String action, TypeScope scopeType, String description) {}
}
