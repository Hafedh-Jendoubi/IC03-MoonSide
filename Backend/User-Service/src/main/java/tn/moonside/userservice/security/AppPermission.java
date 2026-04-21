package tn.moonside.userservice.security;

/**
 * Central registry of every endpoint permission in the system.
 *
 * Naming convention:  <RESOURCE>_<ACTION>[_<SCOPE>]
 * This string is stored as the `action` field in the Permission collection
 * and is used both in @RequiresPermission annotations and in the DataSeeder.
 *
 * The DataSeeder ensures these permissions exist in the DB on startup,
 * and admins can then assign them to roles via the /roles/{id}/permissions API.
 */
public final class AppPermission {

    private AppPermission() {}

    // ─── Users ────────────────────────────────────────────────────────────────
    /** GET /users — list all users */
    public static final String USER_READ_ALL      = "USER_READ_ALL";
    /** GET /users/{id} — read any user by id */
    public static final String USER_READ          = "USER_READ";
    /** GET /users/me — read own profile */
    public static final String USER_READ_OWN      = "USER_READ_OWN";
    /** GET /users/{id}/roles — view a user's roles */
    public static final String USER_READ_ROLES    = "USER_READ_ROLES";
    /** PUT /users/{id} — update any user */
    public static final String USER_UPDATE        = "USER_UPDATE";
    /** PATCH /users/me/avatar — update own avatar */
    public static final String USER_UPDATE_OWN_AVATAR  = "USER_UPDATE_OWN_AVATAR";
    /** DELETE /users/me/avatar — delete own avatar */
    public static final String USER_DELETE_OWN_AVATAR  = "USER_DELETE_OWN_AVATAR";
    /** DELETE /users/{id} — delete any user */
    public static final String USER_DELETE        = "USER_DELETE";
    /** PATCH /users/{id}/deactivate — deactivate a user */
    public static final String USER_DEACTIVATE    = "USER_DEACTIVATE";
    /** PATCH /users/{id}/activate — activate a user */
    public static final String USER_ACTIVATE      = "USER_ACTIVATE";
    /** POST /users/{id}/roles — assign a role to a user */
    public static final String USER_ASSIGN_ROLE   = "USER_ASSIGN_ROLE";
    /** DELETE /users/{id}/roles/{roleId} — revoke a role from a user */
    public static final String USER_REVOKE_ROLE   = "USER_REVOKE_ROLE";
    /** POST /users/invite — invite a single user */
    public static final String USER_INVITE        = "USER_INVITE";
    /** POST /users/invite/bulk — bulk invite users from Excel */
    public static final String USER_INVITE_BULK   = "USER_INVITE_BULK";

    // ─── Roles ────────────────────────────────────────────────────────────────
    /** POST /roles — create a role */
    public static final String ROLE_CREATE        = "ROLE_CREATE";
    /** GET /roles — list all roles */
    public static final String ROLE_READ_ALL      = "ROLE_READ_ALL";
    /** GET /roles/{id} — read a specific role */
    public static final String ROLE_READ          = "ROLE_READ";
    /** PUT /roles/{id} — update a role */
    public static final String ROLE_UPDATE        = "ROLE_UPDATE";
    /** DELETE /roles/{id} — delete a role */
    public static final String ROLE_DELETE        = "ROLE_DELETE";
    /** POST /roles/{id}/permissions/{pid} — assign permission to role */
    public static final String ROLE_ASSIGN_PERMISSION  = "ROLE_ASSIGN_PERMISSION";
    /** DELETE /roles/{id}/permissions/{pid} — revoke permission from role */
    public static final String ROLE_REVOKE_PERMISSION  = "ROLE_REVOKE_PERMISSION";

    // ─── Permissions ──────────────────────────────────────────────────────────
    /** POST /permissions — create a permission */
    public static final String PERMISSION_CREATE  = "PERMISSION_CREATE";
    /** GET /permissions — list all permissions */
    public static final String PERMISSION_READ_ALL = "PERMISSION_READ_ALL";
    /** GET /permissions/{id} — read a specific permission */
    public static final String PERMISSION_READ    = "PERMISSION_READ";
    /** PUT /permissions/{id} — update a permission */
    public static final String PERMISSION_UPDATE  = "PERMISSION_UPDATE";
    /** DELETE /permissions/{id} — delete a permission */
    public static final String PERMISSION_DELETE  = "PERMISSION_DELETE";

    // ─── Audit Logs ───────────────────────────────────────────────────────────
    /** GET /audit-logs — query audit logs */
    public static final String AUDIT_LOG_READ     = "AUDIT_LOG_READ";
    /** GET /audit-logs/stats — view audit log stats */
    public static final String AUDIT_LOG_STATS    = "AUDIT_LOG_STATS";

    // ─── Auth (self-service, no permission guard needed) ─────────────────────
    // /auth/* endpoints are public or guard themselves via the JWT principal.
    // They do NOT require a DB-backed permission; leave them permitAll() in SecurityConfig.
}
