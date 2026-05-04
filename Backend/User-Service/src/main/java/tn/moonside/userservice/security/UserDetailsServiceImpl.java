package tn.moonside.userservice.security;

import tn.moonside.userservice.entities.Permission;
import tn.moonside.userservice.entities.PermissionRole;
import tn.moonside.userservice.entities.Role;
import tn.moonside.userservice.entities.User;
import tn.moonside.userservice.repositories.PermissionRepository;
import tn.moonside.userservice.repositories.PermissionRoleRepository;
import tn.moonside.userservice.repositories.RoleRepository;
import tn.moonside.userservice.repositories.UserRepository;
import tn.moonside.userservice.repositories.UserRoleRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Loads a user's Spring Security authorities from the database.
 *
 * Each authenticated user receives TWO kinds of GrantedAuthority:
 *
 *   1. Role authorities  — prefixed "ROLE_"   (e.g. ROLE_ADMIN, ROLE_MANAGER)
 *      Used for coarse-grained role checks that may still appear in SecurityConfig.
 *
 *   2. Permission authorities — prefixed "PERM_"  (e.g. PERM_USER_READ_ALL)
 *      Used by {@link PermissionAuthorizationFilter} to enforce fine-grained
 *      per-endpoint access control declared via {@link RequiresPermission}.
 *
 * The full authority set is embedded in the JWT principal at login time, so
 * no additional DB round-trips are needed per request.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository            userRepository;
    private final UserRoleRepository        userRoleRepository;
    private final RoleRepository            roleRepository;
    private final PermissionRoleRepository  permissionRoleRepository;
    private final PermissionRepository      permissionRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // ── 1. Resolve the user's roles ─────────────────────────────────────
        List<Role> roles = userRoleRepository.findByUserIdFlexible(user.getId())
                .stream()
                .map(ur -> findRoleById(ur.getRoleId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .distinct()
                .collect(Collectors.toList());

        // ── 2. Build ROLE_ authorities ───────────────────────────────────────
        List<GrantedAuthority> authorities = new ArrayList<>();
        Set<String> roleNames = new HashSet<>();

        for (Role role : roles) {
            String roleName = "ROLE_" + role.getName().toUpperCase();
            if (roleNames.add(roleName)) {
                authorities.add(new SimpleGrantedAuthority(roleName));
            }
        }

        // Always guarantee ROLE_USER so baseline filter matchers work
        if (authorities.isEmpty()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }

        // ── 3. Build PERM_ authorities from role → permission mappings ───────
        Set<String> permissionIds = roles.stream()
                .flatMap(role -> permissionRoleRepository.findByRoleId(role.getId()).stream())
                .map(PermissionRole::getPermissionId)
                .collect(Collectors.toSet());

        for (String permId : permissionIds) {
            permissionRepository.findById(permId).ifPresent(permission -> {
                String permAuthority = PermissionAuthorizationFilter.PERMISSION_PREFIX
                        + permission.getAction().toUpperCase();
                authorities.add(new SimpleGrantedAuthority(permAuthority));
            });
        }

        log.debug("Loaded user '{}' with {} authorities: {}", email, authorities.size(), authorities);
        return new CustomUserDetails(user, authorities);
    }

    /** Looks up a role by its ID, handling both plain String IDs and ObjectId hex strings. */
    private Optional<Role> findRoleById(String roleId) {
        Optional<Role> role = roleRepository.findById(roleId);
        if (role.isPresent()) return role;
        if (roleId != null && ObjectId.isValid(roleId)) {
            return roleRepository.findById(new ObjectId(roleId).toHexString());
        }
        return Optional.empty();
    }

    // ─── CustomUserDetails ────────────────────────────────────────────────────

    public static class CustomUserDetails implements UserDetails {
        @Getter private final String userId;
        private final String email;
        private final String password;
        private final boolean active;
        private final Collection<? extends GrantedAuthority> authorities;

        public CustomUserDetails(User user, Collection<? extends GrantedAuthority> authorities) {
            this.userId      = user.getId();
            this.email       = user.getEmail();
            this.password    = user.getPassword();
            this.active      = user.isActive();
            this.authorities = authorities;
        }

        @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
        @Override public String  getPassword()              { return password; }
        @Override public String  getUsername()              { return email; }
        @Override public boolean isAccountNonExpired()      { return true; }
        @Override public boolean isAccountNonLocked()       { return active; }
        @Override public boolean isCredentialsNonExpired()  { return true; }
        @Override public boolean isEnabled()                { return active; }
    }
}
