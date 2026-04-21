package tn.moonside.userservice.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import tn.moonside.userservice.dtos.responses.ApiResponse;

import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Runs AFTER the JWT filter has populated the SecurityContext.
 * For every request that maps to a handler method annotated with
 * {@link RequiresPermission}, it verifies that the authenticated user
 * holds at least one of the declared permissions in their authorities.
 *
 * Permissions are stored as "PERM_<NAME>" GrantedAuthority strings
 * (loaded by {@link UserDetailsServiceImpl} from the DB at login time).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PermissionAuthorizationFilter extends OncePerRequestFilter {

    private final RequestMappingHandlerMapping requestMappingHandlerMapping;
    private final ObjectMapper objectMapper;

    /** Prefix used when registering permissions as Spring GrantedAuthority entries. */
    public static final String PERMISSION_PREFIX = "PERM_";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Resolve the handler for this request
        HandlerMethod handlerMethod = resolveHandlerMethod(request);

        // No handler found or not a Spring MVC method — let the chain handle it
        if (handlerMethod == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check for @RequiresPermission on the method (method-level takes precedence)
        RequiresPermission annotation = handlerMethod.getMethodAnnotation(RequiresPermission.class);

        // Fall back to class-level annotation if no method-level one exists
        if (annotation == null) {
            annotation = handlerMethod.getBeanType().getAnnotation(RequiresPermission.class);
        }

        // No annotation — no permission check needed; proceed normally
        if (annotation == null) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            sendForbidden(response, "Authentication required");
            return;
        }

        Set<String> userPermissions = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith(PERMISSION_PREFIX))
                .map(a -> a.substring(PERMISSION_PREFIX.length()))
                .collect(Collectors.toSet());

        // CEO wildcard — ANYTHING grants unrestricted access everywhere
        if (userPermissions.contains(tn.moonside.userservice.security.AppPermission.ANYTHING)) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean hasPermission = Arrays.stream(annotation.value())
                .anyMatch(userPermissions::contains);

        if (!hasPermission) {
            log.warn("Access denied for user '{}' to [{}] {} — requires one of: {}",
                    auth.getName(),
                    request.getMethod(),
                    request.getRequestURI(),
                    Arrays.toString(annotation.value()));
            sendForbidden(response, "Access denied: insufficient permissions");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /** Attempts to resolve a HandlerMethod for the current request. Returns null on failure. */
    private HandlerMethod resolveHandlerMethod(HttpServletRequest request) {
        try {
            HandlerExecutionChain chain = requestMappingHandlerMapping.getHandler(request);
            if (chain != null && chain.getHandler() instanceof HandlerMethod hm) {
                return hm;
            }
        } catch (Exception e) {
            log.debug("Could not resolve handler method for {}: {}", request.getRequestURI(), e.getMessage());
        }
        return null;
    }

    private void sendForbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiResponse<Void> body = ApiResponse.error(message);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
