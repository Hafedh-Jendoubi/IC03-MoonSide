package tn.moonside.userservice.security;

import java.lang.annotation.*;

/**
 * Declares the permission(s) required to access a controller method.
 * Use constants from {@link AppPermission}.
 *
 * Example:
 * <pre>
 *   {@literal @}GetMapping
 *   {@literal @}RequiresPermission(AppPermission.USER_READ_ALL)
 *   public ResponseEntity<?> getAllUsers() { ... }
 * </pre>
 *
 * When multiple values are given, the caller must have AT LEAST ONE of them
 * (OR semantics — consistent with Spring Security's hasAnyAuthority).
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequiresPermission {
    /** One or more permission names from {@link AppPermission}. */
    String[] value();
}
