package tn.moonside.userservice.security;

import tn.moonside.userservice.entities.Role;
import tn.moonside.userservice.entities.User;
import tn.moonside.userservice.repositories.RoleRepository;
import tn.moonside.userservice.repositories.UserRepository;
import tn.moonside.userservice.repositories.UserRoleRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Resolve roles from the UserRole join table
        List<GrantedAuthority> authorities = userRoleRepository.findByUserId(user.getId()).stream()
                .map(ur -> roleRepository.findById(ur.getRoleId()).orElse(null))
                .filter(role -> role != null)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName().toUpperCase()))
                .collect(Collectors.toList());

        // Everyone gets at least ROLE_USER
        if (authorities.isEmpty()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }

        return new CustomUserDetails(user, authorities);
    }

    /** UserDetails wrapper that also exposes the Mongo user ID. */
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
