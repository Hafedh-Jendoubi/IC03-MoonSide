package tn.moonside.userservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.moonside.userservice.dtos.requests.RoleRequest;
import tn.moonside.userservice.dtos.responses.RoleResponse;
import tn.moonside.userservice.entities.Permission;
import tn.moonside.userservice.entities.PermissionRole;
import tn.moonside.userservice.entities.Role;
import tn.moonside.userservice.entities.TypeScope;
import tn.moonside.userservice.exceptions.DuplicateResourceException;
import tn.moonside.userservice.exceptions.ResourceNotFoundException;
import tn.moonside.userservice.repositories.PermissionRepository;
import tn.moonside.userservice.repositories.PermissionRoleRepository;
import tn.moonside.userservice.repositories.RoleRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceImplTest {

    @Mock private RoleRepository roleRepository;
    @Mock private PermissionRoleRepository permissionRoleRepository;
    @Mock private PermissionRepository permissionRepository;

    @InjectMocks
    private RoleServiceImpl roleService;

    private Role role;

    @BeforeEach
    void setUp() {
        role = Role.builder().id("r1").name("ADMIN").description("Admin role").build();
    }

    @Test
    void createRole_success() {
        RoleRequest req = new RoleRequest();
        req.setName("ADMIN");
        req.setDescription("Admin role");

        when(roleRepository.existsByName("ADMIN")).thenReturn(false);
        when(roleRepository.save(any(Role.class))).thenReturn(role);

        RoleResponse response = roleService.createRole(req);

        assertThat(response.getId()).isEqualTo("r1");
        assertThat(response.getName()).isEqualTo("ADMIN");
        verify(roleRepository).save(any(Role.class));
    }

    @Test
    void createRole_duplicate_throws() {
        RoleRequest req = new RoleRequest();
        req.setName("ADMIN");

        when(roleRepository.existsByName("ADMIN")).thenReturn(true);

        assertThatThrownBy(() -> roleService.createRole(req))
                .isInstanceOf(DuplicateResourceException.class);
        verify(roleRepository, never()).save(any());
    }

    @Test
    void getRoleById_success() {
        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));
        when(permissionRoleRepository.findByRoleId("r1")).thenReturn(List.of());

        RoleResponse response = roleService.getRoleById("r1");

        assertThat(response.getId()).isEqualTo("r1");
        assertThat(response.getPermissions()).isEmpty();
    }

    @Test
    void getRoleById_notFound_throws() {
        when(roleRepository.findById("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roleService.getRoleById("bad"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getRoleById_withPermissions() {
        Permission p = Permission.builder().id("p1").action("READ").scopeType(TypeScope.GLOBAL).build();
        PermissionRole pr = PermissionRole.builder().roleId("r1").permissionId("p1").build();

        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));
        when(permissionRoleRepository.findByRoleId("r1")).thenReturn(List.of(pr));
        when(permissionRepository.findById("p1")).thenReturn(Optional.of(p));

        RoleResponse response = roleService.getRoleById("r1");

        assertThat(response.getPermissions()).hasSize(1);
        assertThat(response.getPermissions().get(0).getAction()).isEqualTo("READ");
    }

    @Test
    void getRoleByName_success() {
        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(role));
        when(permissionRoleRepository.findByRoleId("r1")).thenReturn(List.of());

        RoleResponse response = roleService.getRoleByName("ADMIN");

        assertThat(response.getName()).isEqualTo("ADMIN");
    }

    @Test
    void getRoleByName_notFound_throws() {
        when(roleRepository.findByName("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roleService.getRoleByName("MISSING"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getAllRoles_returnsList() {
        when(roleRepository.findAll()).thenReturn(List.of(role));
        when(permissionRoleRepository.findByRoleId("r1")).thenReturn(List.of());

        List<RoleResponse> result = roleService.getAllRoles();

        assertThat(result).hasSize(1);
    }

    @Test
    void updateRole_success() {
        RoleRequest req = new RoleRequest();
        req.setName("SUPER_ADMIN");
        req.setDescription("Updated");

        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));
        when(roleRepository.existsByName("SUPER_ADMIN")).thenReturn(false);
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));
        when(permissionRoleRepository.findByRoleId("r1")).thenReturn(List.of());

        RoleResponse response = roleService.updateRole("r1", req);

        assertThat(response.getName()).isEqualTo("SUPER_ADMIN");
    }

    @Test
    void updateRole_sameName_doesNotCheckDuplicate() {
        RoleRequest req = new RoleRequest();
        req.setName("ADMIN");
        req.setDescription("Updated desc");

        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));
        when(permissionRoleRepository.findByRoleId("r1")).thenReturn(List.of());

        RoleResponse response = roleService.updateRole("r1", req);

        assertThat(response.getDescription()).isEqualTo("Updated desc");
        verify(roleRepository, never()).existsByName(anyString());
    }

    @Test
    void updateRole_nameTaken_throws() {
        RoleRequest req = new RoleRequest();
        req.setName("OTHER");

        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));
        when(roleRepository.existsByName("OTHER")).thenReturn(true);

        assertThatThrownBy(() -> roleService.updateRole("r1", req))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void updateRole_notFound_throws() {
        RoleRequest req = new RoleRequest();
        req.setName("X");
        when(roleRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roleService.updateRole("missing", req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteRole_success() {
        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));

        roleService.deleteRole("r1");

        verify(permissionRoleRepository).deleteByRoleId("r1");
        verify(roleRepository).deleteById("r1");
    }

    @Test
    void deleteRole_notFound_throws() {
        when(roleRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roleService.deleteRole("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(roleRepository, never()).deleteById(anyString());
    }

    @Test
    void assignPermissionToRole_success() {
        Permission p = Permission.builder().id("p1").action("READ").scopeType(TypeScope.GLOBAL).build();

        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));
        when(permissionRepository.findById("p1")).thenReturn(Optional.of(p));
        when(permissionRoleRepository.existsByRoleIdAndPermissionId("r1", "p1")).thenReturn(false);

        roleService.assignPermissionToRole("r1", "p1");

        verify(permissionRoleRepository).save(any(PermissionRole.class));
    }

    @Test
    void assignPermissionToRole_roleNotFound_throws() {
        when(roleRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roleService.assignPermissionToRole("missing", "p1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void assignPermissionToRole_permissionNotFound_throws() {
        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));
        when(permissionRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roleService.assignPermissionToRole("r1", "missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void assignPermissionToRole_alreadyAssigned_throws() {
        Permission p = Permission.builder().id("p1").action("READ").scopeType(TypeScope.GLOBAL).build();

        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));
        when(permissionRepository.findById("p1")).thenReturn(Optional.of(p));
        when(permissionRoleRepository.existsByRoleIdAndPermissionId("r1", "p1")).thenReturn(true);

        assertThatThrownBy(() -> roleService.assignPermissionToRole("r1", "p1"))
                .isInstanceOf(DuplicateResourceException.class);
        verify(permissionRoleRepository, never()).save(any());
    }

    @Test
    void revokePermissionFromRole_success() {
        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));

        roleService.revokePermissionFromRole("r1", "p1");

        verify(permissionRoleRepository).deleteByRoleIdAndPermissionId("r1", "p1");
    }

    @Test
    void revokePermissionFromRole_roleNotFound_throws() {
        when(roleRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roleService.revokePermissionFromRole("missing", "p1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
