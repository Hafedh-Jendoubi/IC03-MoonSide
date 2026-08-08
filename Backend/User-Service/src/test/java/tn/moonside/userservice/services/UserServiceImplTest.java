package tn.moonside.userservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import tn.moonside.userservice.dtos.requests.AssignRoleRequest;
import tn.moonside.userservice.dtos.requests.UpdateUserRequest;
import tn.moonside.userservice.dtos.responses.UserResponse;
import tn.moonside.userservice.entities.Role;
import tn.moonside.userservice.entities.TypeScope;
import tn.moonside.userservice.entities.User;
import tn.moonside.userservice.entities.UserRole;
import tn.moonside.userservice.exceptions.DuplicateResourceException;
import tn.moonside.userservice.exceptions.ResourceNotFoundException;
import tn.moonside.userservice.kafka.UserActivityEventPublisher;
import tn.moonside.userservice.repositories.PermissionRepository;
import tn.moonside.userservice.repositories.PermissionRoleRepository;
import tn.moonside.userservice.repositories.RoleRepository;
import tn.moonside.userservice.repositories.UserRepository;
import tn.moonside.userservice.repositories.UserRoleRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private UserRoleRepository userRoleRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PermissionRoleRepository permissionRoleRepository;
    @Mock private PermissionRepository permissionRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JavaMailSender mailSender;
    @Mock private UserActivityEventPublisher userActivityPublisher;

    @InjectMocks
    private UserServiceImpl userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id("u1").email("test@example.com")
                .firstName("Test").lastName("User").isActive(true).build();
        ReflectionTestUtils.setField(userService, "appName", "WorkSphere");
        ReflectionTestUtils.setField(userService, "frontendUrl", "http://localhost:3000");
    }

    @Test
    void getUserById_success() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of());

        UserResponse response = userService.getUserById("u1");

        assertThat(response.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void getUserById_notFound_throws() {
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getUserByEmail_success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of());

        UserResponse response = userService.getUserByEmail("test@example.com");

        assertThat(response.getId()).isEqualTo("u1");
    }

    @Test
    void getUserByEmail_notFound_throws() {
        when(userRepository.findByEmail("missing@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserByEmail("missing@x.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getAllUsers_returnsList() {
        when(userRepository.findAll()).thenReturn(List.of(user));
        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of());

        List<UserResponse> result = userService.getAllUsers();

        assertThat(result).hasSize(1);
    }

    @Test
    void searchByName_blankQuery_returnsEmpty() {
        assertThat(userService.searchByName("  ")).isEmpty();
        assertThat(userService.searchByName(null)).isEmpty();
        verifyNoInteractions(userRepository);
    }

    @Test
    void searchByName_success() {
        when(userRepository.searchByName(anyString())).thenReturn(List.of(user));
        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of());

        List<UserResponse> result = userService.searchByName("Test");

        assertThat(result).hasSize(1);
    }

    @Test
    void updateAvatar_success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of());

        UserResponse response = userService.updateAvatar("test@example.com", "http://avatar.url");

        assertThat(response.getAvatar()).isEqualTo("http://avatar.url");
        verify(auditLogService).log(eq("u1"), eq("u1"), eq("USER"), eq("AVATAR_UPDATE"),
                anyString(), eq(true), any(), any(), any());
    }

    @Test
    void updateAvatar_delete_logsDeleteAction() {
        user.setAvatar("http://old.url");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of());

        userService.updateAvatar("test@example.com", null);

        verify(auditLogService).log(eq("u1"), eq("u1"), eq("USER"), eq("AVATAR_DELETE"),
                anyString(), eq(true), any(), any(), any());
    }

    @Test
    void updateAvatar_userNotFound_throws() {
        when(userRepository.findByEmail("missing@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateAvatar("missing@x.com", "url"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateBanner_success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of());

        UserResponse response = userService.updateBanner("test@example.com", "http://banner.url");

        assertThat(response.getBannerUrl()).isEqualTo("http://banner.url");
        verify(auditLogService).log(eq("u1"), eq("u1"), eq("USER"), eq("BANNER_UPDATE"),
                anyString(), eq(true), any(), any(), any());
    }

    @Test
    void updateBanner_delete_logsDeleteAction() {
        user.setBannerUrl("http://old-banner.url");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of());

        userService.updateBanner("test@example.com", null);

        verify(auditLogService).log(eq("u1"), eq("u1"), eq("USER"), eq("BANNER_DELETE"),
                anyString(), eq(true), any(), any(), any());
    }

    @Test
    void updateUser_partialUpdate_success() {
        UpdateUserRequest req = new UpdateUserRequest();
        req.setFirstName("Updated");

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of());

        UserResponse response = userService.updateUser("u1", req, "admin@x.com");

        assertThat(response.getFirstName()).isEqualTo("Updated");
        verify(userActivityPublisher, never()).publish(any());
    }

    @Test
    void updateUser_completeProfile_publishesEvent() {
        UpdateUserRequest req = new UpdateUserRequest();
        req.setFirstName("Test");
        req.setLastName("User");
        req.setJobTitle("Engineer");
        req.setBio("Bio text");
        req.setAvatar("http://avatar.url");

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of());

        userService.updateUser("u1", req, "admin@x.com");

        verify(userActivityPublisher).publish(any());
    }

    @Test
    void updateUser_notFound_throws() {
        UpdateUserRequest req = new UpdateUserRequest();
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUser("missing", req, "admin@x.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteUser_success() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of());

        userService.deleteUser("u1");

        verify(userRepository).delete(user);
        verify(auditLogService).log(eq("u1"), eq("u1"), eq("USER"), eq("USER_DELETED"),
                anyString(), eq(true), any(), any(), any());
    }

    @Test
    void deleteUser_notFound_throws() {
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void assignRole_success() {
        Role role = Role.builder().id("r1").name("EMPLOYEE").build();
        AssignRoleRequest req = new AssignRoleRequest();
        req.setRoleId("r1");
        req.setScopeType(TypeScope.GLOBAL);

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));
        when(userRoleRepository.existsByUserIdAndRoleIdFlexible("u1", "r1")).thenReturn(false);

        userService.assignRole("u1", req);

        verify(userRoleRepository).save(any(UserRole.class));
    }

    @Test
    void assignRole_userNotFound_throws() {
        AssignRoleRequest req = new AssignRoleRequest();
        req.setRoleId("r1");
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.assignRole("missing", req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void assignRole_roleNotFound_throws() {
        AssignRoleRequest req = new AssignRoleRequest();
        req.setRoleId("missing");

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(roleRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.assignRole("u1", req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void assignRole_alreadyAssigned_throws() {
        Role role = Role.builder().id("r1").name("EMPLOYEE").build();
        AssignRoleRequest req = new AssignRoleRequest();
        req.setRoleId("r1");

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));
        when(userRoleRepository.existsByUserIdAndRoleIdFlexible("u1", "r1")).thenReturn(true);

        assertThatThrownBy(() -> userService.assignRole("u1", req))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void revokeRole_success() {
        Role role = Role.builder().id("r1").name("EMPLOYEE").build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));

        userService.revokeRole("u1", "r1");

        verify(userRoleRepository).deleteByUserIdAndRoleIdFlexible("u1", "r1");
    }

    @Test
    void revokeRole_roleAbsent_stillRevokes() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(roleRepository.findById("missing")).thenReturn(Optional.empty());

        userService.revokeRole("u1", "missing");

        verify(userRoleRepository).deleteByUserIdAndRoleIdFlexible("u1", "missing");
    }

    @Test
    void revokeRoleByName_success() {
        Role role = Role.builder().id("r1").name("EMPLOYEE").build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(roleRepository.findByName("EMPLOYEE")).thenReturn(Optional.of(role));

        userService.revokeRoleByName("u1", "EMPLOYEE");

        verify(userRoleRepository).deleteByUserIdAndRoleIdFlexible("u1", "r1");
    }

    @Test
    void revokeRoleByName_roleNotFound_doesNothing() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(roleRepository.findByName("MISSING")).thenReturn(Optional.empty());

        userService.revokeRoleByName("u1", "MISSING");

        verify(userRoleRepository, never()).deleteByUserIdAndRoleIdFlexible(anyString(), anyString());
    }

    @Test
    void deactivateUser_success() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        userService.deactivateUser("u1");

        assertThat(user.isActive()).isFalse();
        verify(userRepository).save(user);
    }

    @Test
    void activateUser_success() {
        user.setActive(false);
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        userService.activateUser("u1");

        assertThat(user.isActive()).isTrue();
        verify(userRepository).save(user);
    }

    @Test
    void getUserRoleNames_returnsDistinctNames() {
        UserRole ur1 = UserRole.builder().userId("u1").roleId("r1").build();
        Role role = Role.builder().id("r1").name("ADMIN").build();

        when(userRoleRepository.findByUserIdFlexible("u1")).thenReturn(List.of(ur1));
        when(roleRepository.findById("r1")).thenReturn(Optional.of(role));

        List<String> names = userService.getUserRoleNames("u1");

        assertThat(names).containsExactly("ADMIN");
    }

    @Test
    void bulkInviteFromExcel_invalidFileType_throws() {
        org.springframework.mock.web.MockMultipartFile file =
                new org.springframework.mock.web.MockMultipartFile("file", "data.txt", "text/plain", "hi".getBytes());

        assertThatThrownBy(() -> userService.bulkInviteFromExcel(file))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
