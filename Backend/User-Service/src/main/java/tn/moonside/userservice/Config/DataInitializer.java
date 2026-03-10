package tn.moonside.userservice.Config;

import tn.moonside.userservice.Enums.TypeScope;
import tn.moonside.userservice.Entities.Permission;
import tn.moonside.userservice.Entities.Role;
import tn.moonside.userservice.Repositories.PermissionRepository;
import tn.moonside.userservice.Repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    public void run(String... args) {
        log.info("Initializing default data...");

        // Create default permissions if they don't exist
        createPermissionIfNotFound("USER_READ", TypeScope.OWN, "Read own user data");
        createPermissionIfNotFound("USER_READ", TypeScope.TEAM, "Read team user data");
        createPermissionIfNotFound("USER_READ", TypeScope.DEPARTMENT, "Read department user data");
        createPermissionIfNotFound("USER_READ", TypeScope.GLOBAL, "Read all user data");

        createPermissionIfNotFound("USER_WRITE", TypeScope.OWN, "Update own user data");
        createPermissionIfNotFound("USER_WRITE", TypeScope.TEAM, "Update team user data");
        createPermissionIfNotFound("USER_WRITE", TypeScope.DEPARTMENT, "Update department user data");
        createPermissionIfNotFound("USER_WRITE", TypeScope.GLOBAL, "Update all user data");

        createPermissionIfNotFound("ROLE_READ", TypeScope.GLOBAL, "Read role data");
        createPermissionIfNotFound("ROLE_WRITE", TypeScope.GLOBAL, "Create/update role data");

        // Create default roles
        createRoleIfNotFound("ADMIN", "Administrator with full access");
        createRoleIfNotFound("MANAGER", "Manager with department-level access");
        createRoleIfNotFound("TEAM_LEAD", "Team lead with team-level access");
        createRoleIfNotFound("EMPLOYEE", "Regular employee with own data access");

        // Assign permissions to roles
        assignPermissionsToRole("ADMIN",
                "USER_READ:GLOBAL", "USER_WRITE:GLOBAL",
                "ROLE_READ:GLOBAL", "ROLE_WRITE:GLOBAL");

        assignPermissionsToRole("MANAGER",
                "USER_READ:DEPARTMENT", "USER_WRITE:DEPARTMENT",
                "ROLE_READ:GLOBAL");

        assignPermissionsToRole("TEAM_LEAD",
                "USER_READ:TEAM", "USER_WRITE:TEAM");

        assignPermissionsToRole("EMPLOYEE",
                "USER_READ:OWN", "USER_WRITE:OWN");

        log.info("Data initialization completed");
    }

    private void createPermissionIfNotFound(String action, TypeScope scope, String description) {
        if (!permissionRepository.existsByActionAndScopeType(action, scope)) {
            Permission permission = Permission.builder()
                    .permissionId(UUID.randomUUID())
                    .action(action)
                    .scopeType(scope)
                    .description(description)
                    .createdAt(LocalDateTime.now())
                    .build();
            permissionRepository.save(permission);
            log.info("Created permission: {} - {}", action, scope);
        }
    }

    private void createRoleIfNotFound(String name, String description) {
        if (!roleRepository.existsByName(name)) {
            Role role = Role.builder()
                    .roleId(UUID.randomUUID())
                    .name(name)
                    .description(description)
                    .createdAt(LocalDateTime.now())
                    .permissions(new HashSet<>())
                    .build();
            roleRepository.save(role);
            log.info("Created role: {}", name);
        }
    }

    private void assignPermissionsToRole(String roleName, String... permissionKeys) {
        roleRepository.findByName(roleName).ifPresent(role -> {
            Arrays.stream(permissionKeys).forEach(key -> {
                String[] parts = key.split(":");
                String action = parts[0];
                TypeScope scope = TypeScope.valueOf(parts[1]);

                permissionRepository.findByActionAndScopeType(action, scope).ifPresent(permission -> {
                    if (!role.getPermissions().contains(permission)) {
                        role.getPermissions().add(permission);
                        log.info("Assigned permission {} to role {}", key, roleName);
                    }
                });
            });
            roleRepository.save(role);
        });
    }
}