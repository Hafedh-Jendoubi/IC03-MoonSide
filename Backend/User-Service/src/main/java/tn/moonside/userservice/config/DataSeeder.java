package tn.moonside.userservice.config;

import tn.moonside.userservice.entities.Permission;
import tn.moonside.userservice.entities.Role;
import tn.moonside.userservice.entities.TypeScope;
import tn.moonside.userservice.repositories.PermissionRepository;
import tn.moonside.userservice.repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    public void run(String... args) {
        seedRoles();
        seedPermissions();
    }

    private void seedRoles() {
        List<String> defaultRoles = List.of("ADMIN", "MANAGER", "MEMBER", "GUEST");

        defaultRoles.forEach(roleName -> {
            if (!roleRepository.existsByName(roleName)) {
                Role role = Role.builder()
                        .name(roleName)
                        .description("Default " + roleName.toLowerCase() + " role")
                        .build();
                roleRepository.save(role);
                log.info("Seeded role: {}", roleName);
            }
        });
    }

    private void seedPermissions() {
        List<Permission> defaultPermissions = List.of(
                buildPermission("USER_READ", TypeScope.ALL, "Read all users"),
                buildPermission("USER_WRITE", TypeScope.ALL, "Write all users"),
                buildPermission("USER_READ", TypeScope.DEPARTMENT, "Read department users"),
                buildPermission("USER_WRITE", TypeScope.DEPARTMENT, "Write department users"),
                buildPermission("USER_READ", TypeScope.TEAM, "Read team users"),
                buildPermission("USER_WRITE", TypeScope.TEAM, "Write team users"),
                buildPermission("USER_READ", TypeScope.OWN, "Read own profile"),
                buildPermission("USER_WRITE", TypeScope.OWN, "Write own profile"),
                buildPermission("ROLE_MANAGE", TypeScope.GLOBAL, "Manage roles globally"),
                buildPermission("PERMISSION_MANAGE", TypeScope.GLOBAL, "Manage permissions globally")
        );

        defaultPermissions.forEach(permission -> {
            if (!permissionRepository.existsByActionAndScopeType(permission.getAction(), permission.getScopeType())) {
                permissionRepository.save(permission);
                log.info("Seeded permission: {} - {}", permission.getAction(), permission.getScopeType());
            }
        });
    }

    private Permission buildPermission(String action, TypeScope scopeType, String description) {
        return Permission.builder()
                .action(action)
                .scopeType(scopeType)
                .description(description)
                .build();
    }
}