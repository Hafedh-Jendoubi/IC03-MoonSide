package tn.moonside.userservice.security;

/**
 * Central registry of every endpoint permission in the system.
 *
 * Naming convention:  <RESOURCE>_<ACTION>[_<SCOPE>]
 * This string is stored as the `action` field in the Permission collection
 * and is used both in @RequiresPermission annotations and in the DataSeeder.
 *
 * Role → Permission mapping (ADDITIVE — each role adds its OWN unique permissions)
 * ─────────────────────────────────────────────────────────────────────────────────
 *  EMPLOYEE          — Own profile read/write (login is implicit via auth)
 *  TEAM_LEADER       — Manage own team (details, members) — builds on EMPLOYEE
 *  DEPARTMENT_LEADER — Manage own department + teams within it — builds on TEAM_LEADER
 *  HUMAN_RESOURCES   — Dashboard read + Users management (invite only, no bulk) + Orgs read
 *  CEO               — Unrestricted via ANYTHING wildcard
 *
 * MULTI-ROLE DESIGN: A user with [EMPLOYEE, TEAM_LEADER] gets the union of both
 * permission sets. There are NO shared permissions between roles.
 */
public final class AppPermission {

    private AppPermission() {}

    // ─── CEO wildcard ─────────────────────────────────────────────────────────
    /** Bypasses ALL permission checks — granted only to CEO role */
    public static final String ANYTHING = "ANYTHING";

    // ─── Own Profile (EMPLOYEE role) ──────────────────────────────────────────
    /** GET /users/me — read own profile */
    public static final String USER_READ_OWN             = "USER_READ_OWN";
    /** PUT /users/me — update own profile fields */
    public static final String USER_UPDATE_OWN           = "USER_UPDATE_OWN";
    /** PATCH /users/me/avatar — update own avatar */
    public static final String USER_UPDATE_OWN_AVATAR    = "USER_UPDATE_OWN_AVATAR";
    /** DELETE /users/me/avatar — delete own avatar */
    public static final String USER_DELETE_OWN_AVATAR    = "USER_DELETE_OWN_AVATAR";

    // ─── View all content (EMPLOYEE role) ────────────────────────────────────
    /** GET /users — view any user profile (read-only, not back office) */
    public static final String USER_READ                 = "USER_READ";
    /** GET /users/{id}/roles — view a user's roles */
    public static final String USER_READ_ROLES           = "USER_READ_ROLES";

    // ─── Team membership assignment (TEAM_LEADER, DEPARTMENT_LEADER, HUMAN_RESOURCES) ──
    /** POST /organizations/teams/{id}/assign/{userId} — assign a user as member to a team */
    public static final String TEAM_ASSIGN_MEMBER        = "TEAM_ASSIGN_MEMBER";

    // ─── Follow system (EMPLOYEE role) ────────────────────────────────────────
    /** POST/DELETE /organizations/departments/{id}/follow — follow or unfollow a department */
    public static final String FOLLOW_DEPARTMENT         = "FOLLOW_DEPARTMENT";
    /** POST/DELETE /organizations/teams/{id}/follow — follow or unfollow a team */
    public static final String FOLLOW_TEAM               = "FOLLOW_TEAM";

    // ─── Team management (TEAM_LEADER role) ──────────────────────────────────
    /** GET/PUT /organizations/teams/{id} — manage team details for own team */
    public static final String TEAM_MANAGE               = "TEAM_MANAGE";
    /** POST/DELETE /organizations/teams/{id}/members — add or remove members from own team */
    public static final String TEAM_MANAGE_MEMBERS       = "TEAM_MANAGE_MEMBERS";
    /** PATCH /organizations/teams/{id}/lead — assign/change team lead within own team */
    public static final String TEAM_MANAGE_LEAD          = "TEAM_MANAGE_LEAD";

    // ─── Department management (DEPARTMENT_LEADER role) ──────────────────────
    /** GET/PUT /organizations/departments/{id} — manage own department details */
    public static final String DEPT_MANAGE               = "DEPT_MANAGE";
    /** POST /organizations/departments/{id}/teams — create teams within own department */
    public static final String DEPT_MANAGE_TEAMS         = "DEPT_MANAGE_TEAMS";
    /** PATCH /organizations/departments/{id}/manager — assign/change dept manager */
    public static final String DEPT_MANAGE_MANAGER       = "DEPT_MANAGE_MANAGER";

    // ─── HR back-office access (HUMAN_RESOURCES role) ────────────────────────
    /** Access back-office dashboard page (read-only analytics) */
    public static final String BACKOFFICE_DASHBOARD_READ = "BACKOFFICE_DASHBOARD_READ";
    /** GET /users — list all users in the back office */
    public static final String USER_READ_ALL             = "USER_READ_ALL";
    /** POST /users/invite — invite a single user */
    public static final String USER_INVITE               = "USER_INVITE";
    /** GET /organizations — read organizations in the back office */
    public static final String ORG_READ                  = "ORG_READ";

    // ─── CEO / Full admin access (CEO role, via ANYTHING) ────────────────────
    /** POST /users/invite/bulk — bulk invite users from Excel (CEO only) */
    public static final String USER_INVITE_BULK          = "USER_INVITE_BULK";
    /** POST /roles — create a role */
    public static final String ROLE_CREATE               = "ROLE_CREATE";
    /** GET /roles — list all roles */
    public static final String ROLE_READ_ALL             = "ROLE_READ_ALL";
    /** GET /roles/{id} — read a specific role */
    public static final String ROLE_READ                 = "ROLE_READ";
    /** PUT /roles/{id} — update a role */
    public static final String ROLE_UPDATE               = "ROLE_UPDATE";
    /** DELETE /roles/{id} — delete a role */
    public static final String ROLE_DELETE               = "ROLE_DELETE";
    /** POST /roles/{id}/permissions/{pid} — assign permission to role */
    public static final String ROLE_ASSIGN_PERMISSION    = "ROLE_ASSIGN_PERMISSION";
    /** DELETE /roles/{id}/permissions/{pid} — revoke permission from role */
    public static final String ROLE_REVOKE_PERMISSION    = "ROLE_REVOKE_PERMISSION";
    /** POST /permissions — create a permission */
    public static final String PERMISSION_CREATE         = "PERMISSION_CREATE";
    /** GET /permissions — list all permissions */
    public static final String PERMISSION_READ_ALL       = "PERMISSION_READ_ALL";
    /** GET /permissions/{id} — read a specific permission */
    public static final String PERMISSION_READ           = "PERMISSION_READ";
    /** PUT /permissions/{id} — update a permission */
    public static final String PERMISSION_UPDATE         = "PERMISSION_UPDATE";
    /** DELETE /permissions/{id} — delete a permission */
    public static final String PERMISSION_DELETE         = "PERMISSION_DELETE";
    /** PUT /users/{id} — update any user */
    public static final String USER_UPDATE               = "USER_UPDATE";
    /** DELETE /users/{id} — delete any user */
    public static final String USER_DELETE               = "USER_DELETE";
    /** PATCH /users/{id}/deactivate */
    public static final String USER_DEACTIVATE           = "USER_DEACTIVATE";
    /** PATCH /users/{id}/activate */
    public static final String USER_ACTIVATE             = "USER_ACTIVATE";
    /** POST /users/{id}/roles — assign a role to a user */
    public static final String USER_ASSIGN_ROLE          = "USER_ASSIGN_ROLE";
    /** DELETE /users/{id}/roles/{roleId} — revoke a role from a user */
    public static final String USER_REVOKE_ROLE          = "USER_REVOKE_ROLE";
    /** GET /audit-logs */
    public static final String AUDIT_LOG_READ            = "AUDIT_LOG_READ";
    /** GET /audit-logs/stats */
    public static final String AUDIT_LOG_STATS           = "AUDIT_LOG_STATS";
    /** Full organization management */
    public static final String ORG_MANAGE                = "ORG_MANAGE";
    /** Access roles & settings pages in back office */
    public static final String BACKOFFICE_FULL           = "BACKOFFICE_FULL";
}
