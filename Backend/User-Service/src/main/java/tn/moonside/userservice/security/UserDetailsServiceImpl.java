package tn.moonside.userservice.security;

import tn.moonside.userservice.entities.Role;
import tn.moonside.userservice.entities.User;
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

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Use the flexible finder that handles both ObjectId and String stored values
        List<GrantedAuthority> authorities = userRoleRepository.findByUserIdFlexible(user.getId())
                .stream()
                .map(ur -> findRoleById(ur.getRoleId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName().toUpperCase()))
                .distinct()
                .collect(Collectors.toList());

        if (authorities.isEmpty()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }

        log.debug("Loaded user {} with authorities: {}", email, authorities);
        return new CustomUserDetails(user, authorities);
    }

    /**
     * Looks up a role by its ID, handling both plain String IDs and
     * hex ObjectId strings that were stored as ObjectId in the DB.
     */
    private Optional<Role> findRoleById(String roleId) {
        // Direct lookup first (works when roleId stored as String)
        Optional<Role> role = roleRepository.findById(roleId);
        if (role.isPresent()) return role;

        // Fallback: the stored value might be an ObjectId hex string
        if (roleId != null && ObjectId.isValid(roleId)) {
            return roleRepository.findById(new ObjectId(roleId).toHexString());
        }
        return Optional.empty();
    }

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
        @Override public String getPassword()                                      { return password; }
        @Override public String getUsername()                                      { return email; }
        @Override public boolean isAccountNonExpired()                             { return true; }
        @Override public boolean isAccountNonLocked()                              { return active; }
        @Override public boolean isCredentialsNonExpired()                         { return true; }
        @Override public boolean isEnabled()                                       { return active; }
    }
}
