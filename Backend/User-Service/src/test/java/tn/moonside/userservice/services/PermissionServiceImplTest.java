package tn.moonside.userservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.moonside.userservice.dtos.requests.PermissionRequest;
import tn.moonside.userservice.dtos.responses.PermissionResponse;
import tn.moonside.userservice.entities.Permission;
import tn.moonside.userservice.entities.TypeScope;
import tn.moonside.userservice.exceptions.DuplicateResourceException;
import tn.moonside.userservice.exceptions.ResourceNotFoundException;
import tn.moonside.userservice.repositories.PermissionRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PermissionServiceImplTest {

    @Mock
    private PermissionRepository permissionRepository;

    @InjectMocks
    private PermissionServiceImpl permissionService;

    private Permission permission;

    @BeforeEach
    void setUp() {
        permission = Permission.builder()
                .id("p1").action("READ_USER").scopeType(TypeScope.GLOBAL).description("desc").build();
    }

    @Test
    void createPermission_success() {
        PermissionRequest req = new PermissionRequest();
        req.setAction("READ_USER");
        req.setScopeType(TypeScope.GLOBAL);
        req.setDescription("desc");

        when(permissionRepository.existsByActionAndScopeType("READ_USER", TypeScope.GLOBAL)).thenReturn(false);
        when(permissionRepository.save(any(Permission.class))).thenReturn(permission);

        PermissionResponse response = permissionService.createPermission(req);

        assertThat(response.getId()).isEqualTo("p1");
        assertThat(response.getAction()).isEqualTo("READ_USER");
    }

    @Test
    void createPermission_duplicate_throws() {
        PermissionRequest req = new PermissionRequest();
        req.setAction("READ_USER");
        req.setScopeType(TypeScope.GLOBAL);

        when(permissionRepository.existsByActionAndScopeType("READ_USER", TypeScope.GLOBAL)).thenReturn(true);

        assertThatThrownBy(() -> permissionService.createPermission(req))
                .isInstanceOf(DuplicateResourceException.class);
        verify(permissionRepository, never()).save(any());
    }

    @Test
    void getPermissionById_success() {
        when(permissionRepository.findById("p1")).thenReturn(Optional.of(permission));

        PermissionResponse response = permissionService.getPermissionById("p1");

        assertThat(response.getAction()).isEqualTo("READ_USER");
    }

    @Test
    void getPermissionById_notFound_throws() {
        when(permissionRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> permissionService.getPermissionById("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getAllPermissions_returnsList() {
        when(permissionRepository.findAll()).thenReturn(List.of(permission));

        List<PermissionResponse> result = permissionService.getAllPermissions();

        assertThat(result).hasSize(1);
    }

    @Test
    void getPermissionsByScopeType_returnsList() {
        when(permissionRepository.findByScopeType(TypeScope.GLOBAL)).thenReturn(List.of(permission));

        List<PermissionResponse> result = permissionService.getPermissionsByScopeType(TypeScope.GLOBAL);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getScopeType()).isEqualTo(TypeScope.GLOBAL);
    }

    @Test
    void updatePermission_success_actionChanged() {
        PermissionRequest req = new PermissionRequest();
        req.setAction("WRITE_USER");
        req.setScopeType(TypeScope.GLOBAL);
        req.setDescription("new desc");

        when(permissionRepository.findById("p1")).thenReturn(Optional.of(permission));
        when(permissionRepository.existsByActionAndScopeType("WRITE_USER", TypeScope.GLOBAL)).thenReturn(false);
        when(permissionRepository.save(any(Permission.class))).thenAnswer(inv -> inv.getArgument(0));

        PermissionResponse response = permissionService.updatePermission("p1", req);

        assertThat(response.getAction()).isEqualTo("WRITE_USER");
    }

    @Test
    void updatePermission_noChange_doesNotCheckDuplicate() {
        PermissionRequest req = new PermissionRequest();
        req.setAction("READ_USER");
        req.setScopeType(TypeScope.GLOBAL);
        req.setDescription("changed desc only");

        when(permissionRepository.findById("p1")).thenReturn(Optional.of(permission));
        when(permissionRepository.save(any(Permission.class))).thenAnswer(inv -> inv.getArgument(0));

        PermissionResponse response = permissionService.updatePermission("p1", req);

        assertThat(response.getDescription()).isEqualTo("changed desc only");
        verify(permissionRepository, never()).existsByActionAndScopeType(any(), any());
    }

    @Test
    void updatePermission_duplicateTarget_throws() {
        PermissionRequest req = new PermissionRequest();
        req.setAction("WRITE_USER");
        req.setScopeType(TypeScope.GLOBAL);

        when(permissionRepository.findById("p1")).thenReturn(Optional.of(permission));
        when(permissionRepository.existsByActionAndScopeType("WRITE_USER", TypeScope.GLOBAL)).thenReturn(true);

        assertThatThrownBy(() -> permissionService.updatePermission("p1", req))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void updatePermission_notFound_throws() {
        PermissionRequest req = new PermissionRequest();
        req.setAction("X");
        req.setScopeType(TypeScope.GLOBAL);
        when(permissionRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> permissionService.updatePermission("missing", req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deletePermission_success() {
        when(permissionRepository.findById("p1")).thenReturn(Optional.of(permission));

        permissionService.deletePermission("p1");

        verify(permissionRepository).deleteById("p1");
    }

    @Test
    void deletePermission_notFound_throws() {
        when(permissionRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> permissionService.deletePermission("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(permissionRepository, never()).deleteById(anyString());
    }
}
