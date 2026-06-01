package tn.moonside.userservice.security;

/**
 * Central registry of every permission in the system.
 *
 * ── Naming convention ────────────────────────────────────────────────────────
 *
 *   <SERVICE>_<RESOURCE>_<ACTION>
 *
 *   SERVICE   : which microservice owns the resource
 *               (omitted for User-Service — it is the "home" service)
 *   RESOURCE  : the thing being acted on  (USER, TEAM, DEPT, POST, COMMENT…)
 *   ACTION    : what is being done
 *               VIEW        — read / list (safe, no side effects)
 *               EDIT        — update an existing record
 *               CREATE      — create a new record
 *               DELETE      — delete a record
 *               INVITE      — send an invitation e-mail
 *               ASSIGN      — assign a relationship (role → user, member → team)
 *               REVOKE      — remove a relationship
 *               ACTIVATE    — re-enable a disabled record
 *               DEACTIVATE  — disable a record
 *               FOLLOW      — subscribe to notifications for a record
 *               PIN         — pin a post to the top of a feed
 *               REACT       — add / change an emoji reaction
 *               VOTE        — cast a vote on a survey
 *               SAVE        — bookmark a post
 *               UPLOAD      — upload a file attachment
 *
 *   Scope is encoded directly in the name when it matters:
 *     _OWN        — only the record that belongs to the calling user
 *     _ANY        — any record regardless of ownership (moderation / admin)
 *     (no suffix) — all records within the user's natural scope (e.g. own team for
 *                   TEAM_LEADER, own department for DEPARTMENT_LEADER)
 *
 * ── Role → Permission overview ───────────────────────────────────────────────
 *
 *   EMPLOYEE          Own profile · view users / teams / depts / posts · interact with posts
 *   TEAM_MEMBER       Everything EMPLOYEE has  (identical set; separate role for clarity)
 *   TEAM_LEADER       Manage own team (members, lead, details) · pin posts in own team
 *   DEPARTMENT_LEADER Manage own department + its teams · pin posts in dept · moderate comments
 *   HUMAN_RESOURCES   Back-office dashboard · user list & single invite · read posts & org data
 *   CEO               ANYTHING wildcard — bypasses all permission checks
 *
 *   Roles are ADDITIVE.  A user with [EMPLOYEE, TEAM_LEADER] holds the union
 *   of both permission sets.
 */
public final class AppPermission {

    private AppPermission() {}

    // =========================================================================
    // ── CEO wildcard ──────────────────────────────────────────────────────────
    // =========================================================================

    /** Bypasses ALL permission checks — granted only to the CEO role. */
    public static final String ANYTHING = "ANYTHING";


    // =========================================================================
    // ── USER-SERVICE : User management ───────────────────────────────────────
    // =========================================================================

    // ── Own profile (EMPLOYEE) ────────────────────────────────────────────────

    /** GET  /users/me — view own profile */
    public static final String USER_VIEW_OWN            = "USER_VIEW_OWN";

    /** PUT  /users/me — edit own profile fields */
    public static final String USER_EDIT_OWN            = "USER_EDIT_OWN";

    /** PATCH /users/me/avatar — upload / change own avatar */
    public static final String USER_EDIT_OWN_AVATAR     = "USER_EDIT_OWN_AVATAR";

    /** DELETE /users/me/avatar — remove own avatar */
    public static final String USER_DELETE_OWN_AVATAR   = "USER_DELETE_OWN_AVATAR";

    // ── Viewing other users (EMPLOYEE) ────────────────────────────────────────

    /** GET /users/{id}  — view any user's public profile */
    public static final String USER_VIEW                = "USER_VIEW";

    /** GET /users — list all users (available to employees for browsing the directory) */
    public static final String USER_VIEW_ALL            = "USER_VIEW_ALL";

    /** GET /users/{id}/roles — view the roles assigned to a user */
    public static final String USER_VIEW_ROLES          = "USER_VIEW_ROLES";

    // ── HR / admin user operations ────────────────────────────────────────────

    /** POST /users/invite — invite a single user by e-mail (HR) */
    public static final String USER_INVITE              = "USER_INVITE";

    /** POST /users/invite/bulk — bulk-invite users from an Excel file (CEO only) */
    public static final String USER_INVITE_BULK         = "USER_INVITE_BULK";

    /** PUT /users/{id} — edit any user's profile (CEO) */
    public static final String USER_EDIT_ANY            = "USER_EDIT_ANY";

    /** DELETE /users/{id} — permanently delete a user (CEO) */
    public static final String USER_DELETE_ANY          = "USER_DELETE_ANY";

    /** PATCH /users/{id}/deactivate — suspend a user account (CEO) */
    public static final String USER_DEACTIVATE          = "USER_DEACTIVATE";

    /** PATCH /users/{id}/activate — re-enable a suspended account (CEO) */
    public static final String USER_ACTIVATE            = "USER_ACTIVATE";

    // ── Role assignment ───────────────────────────────────────────────────────

    /** POST /users/{id}/roles — assign a role to a user (CEO) */
    public static final String USER_ASSIGN_ROLE         = "USER_ASSIGN_ROLE";

    /** DELETE /users/{id}/roles/{roleId} — revoke a role from a user (CEO) */
    public static final String USER_REVOKE_ROLE         = "USER_REVOKE_ROLE";


    // =========================================================================
    // ── USER-SERVICE : Role & Permission management (CEO only) ───────────────
    // =========================================================================

    /** POST   /roles          — create a new role */
    public static final String ROLE_CREATE              = "ROLE_CREATE";

    /** GET    /roles          — list all roles */
    public static final String ROLE_VIEW_ALL            = "ROLE_VIEW_ALL";

    /** GET    /roles/{id}     — view a specific role */
    public static final String ROLE_VIEW                = "ROLE_VIEW";

    /** PUT    /roles/{id}     — rename / update a role */
    public static final String ROLE_EDIT                = "ROLE_EDIT";

    /** DELETE /roles/{id}     — delete a role */
    public static final String ROLE_DELETE              = "ROLE_DELETE";

    /** POST   /roles/{id}/permissions/{pid} — attach a permission to a role */
    public static final String ROLE_ASSIGN_PERMISSION   = "ROLE_ASSIGN_PERMISSION";

    /** DELETE /roles/{id}/permissions/{pid} — detach a permission from a role */
    public static final String ROLE_REVOKE_PERMISSION   = "ROLE_REVOKE_PERMISSION";

    /** POST   /permissions          — create a permission definition */
    public static final String PERMISSION_CREATE        = "PERMISSION_CREATE";

    /** GET    /permissions          — list all permission definitions */
    public static final String PERMISSION_VIEW_ALL      = "PERMISSION_VIEW_ALL";

    /** GET    /permissions/{id}     — view a permission definition */
    public static final String PERMISSION_VIEW          = "PERMISSION_VIEW";

    /** PUT    /permissions/{id}     — update a permission definition */
    public static final String PERMISSION_EDIT          = "PERMISSION_EDIT";

    /** DELETE /permissions/{id}     — delete a permission definition */
    public static final String PERMISSION_DELETE        = "PERMISSION_DELETE";


    // =========================================================================
    // ── USER-SERVICE : Audit logs ─────────────────────────────────────────────
    // =========================================================================

    /** GET /audit-logs       — query the audit log (CEO) */
    public static final String AUDIT_LOG_VIEW           = "AUDIT_LOG_VIEW";

    /** GET /audit-logs/stats — view aggregated audit statistics (CEO) */
    public static final String AUDIT_LOG_VIEW_STATS     = "AUDIT_LOG_VIEW_STATS";


    // =========================================================================
    // ── USER-SERVICE : Back-office access ────────────────────────────────────
    // =========================================================================

    /** Read-only access to the back-office analytics dashboard (HR) */
    public static final String BACKOFFICE_DASHBOARD_VIEW = "BACKOFFICE_DASHBOARD_VIEW";

    /** Full access to back-office settings, roles, and audit pages (CEO) */
    public static final String BACKOFFICE_FULL          = "BACKOFFICE_FULL";


    // =========================================================================
    // ── ORGANIZATION-SERVICE : Teams ─────────────────────────────────────────
    // =========================================================================

    /** GET /organizations/teams/** — view team details, members, and projects */
    public static final String TEAM_VIEW                = "TEAM_VIEW";

    /** PUT / PATCH /organizations/teams/{id} — edit a team's details (Team Leader, Dept Leader) */
    public static final String TEAM_EDIT                = "TEAM_EDIT";

    /** POST /organizations/teams/{id}/members — add a member to a team */
    public static final String TEAM_ADD_MEMBER          = "TEAM_ADD_MEMBER";

    /** DELETE /organizations/teams/{id}/members — remove a member from a team */
    public static final String TEAM_REMOVE_MEMBER       = "TEAM_REMOVE_MEMBER";

    /** POST /organizations/teams/{id}/assign/{userId} — assign a user as a team member (HR / leaders) */
    public static final String TEAM_ASSIGN_MEMBER       = "TEAM_ASSIGN_MEMBER";

    /** PATCH /organizations/teams/{id}/lead — change who leads a team */
    public static final String TEAM_CHANGE_LEAD         = "TEAM_CHANGE_LEAD";

    /** POST  /organizations/teams/{teamId}/follow   — subscribe to team updates */
    public static final String TEAM_FOLLOW              = "TEAM_FOLLOW";


    // =========================================================================
    // ── ORGANIZATION-SERVICE : Departments ───────────────────────────────────
    // =========================================================================

    /** GET /organizations/departments/** — view department details (all authenticated users) */
    public static final String DEPT_VIEW                = "DEPT_VIEW";

    /** PUT /organizations/departments/{id} — edit department details (Dept Leader) */
    public static final String DEPT_EDIT                = "DEPT_EDIT";

    /** POST /organizations/departments/{id}/teams — create a new team inside a department (Dept Leader) */
    public static final String DEPT_CREATE_TEAM         = "DEPT_CREATE_TEAM";

    /** PATCH /organizations/departments/{id}/manager — reassign the department manager (Dept Leader) */
    public static final String DEPT_CHANGE_MANAGER      = "DEPT_CHANGE_MANAGER";

    /** POST  /organizations/departments/{id}/follow   — subscribe to department updates */
    public static final String DEPT_FOLLOW              = "DEPT_FOLLOW";


    // =========================================================================
    // ── ORGANIZATION-SERVICE : Projects ──────────────────────────────────────
    // =========================================================================

    /** GET /organizations/projects/** — view projects */
    public static final String PROJECT_VIEW             = "PROJECT_VIEW";

    /** POST /organizations/teams/{teamId}/projects — create a project under a team (Team Leader +) */
    public static final String PROJECT_CREATE_TEAM      = "PROJECT_CREATE_TEAM";

    /** POST /organizations/departments/{deptId}/projects — create a project under a dept (Dept Leader +) */
    public static final String PROJECT_CREATE_DEPT      = "PROJECT_CREATE_DEPT";

    /** PUT /organizations/projects/{id} — edit a project (CEO) */
    public static final String PROJECT_EDIT             = "PROJECT_EDIT";

    /** DELETE /organizations/projects/{id} — delete a project (CEO) */
    public static final String PROJECT_DELETE           = "PROJECT_DELETE";

    /** GET /organizations — list all organizations in back-office (HR) */
    public static final String ORG_VIEW                 = "ORG_VIEW";

    /** Full organization management — create/delete departments, orgs (CEO) */
    public static final String ORG_MANAGE               = "ORG_MANAGE";


    // =========================================================================
    // ── POST-SERVICE : Posts ──────────────────────────────────────────────────
    // =========================================================================

    /** GET /posts/feed, /posts/{id}, /posts/author/**, /posts/team/**, /posts/department/** */
    public static final String POST_VIEW                = "POST_VIEW";

    /** POST /posts — create a post */
    public static final String POST_CREATE              = "POST_CREATE";

    /** PUT /posts/{id} — edit own post (ownership enforced in service) */
    public static final String POST_EDIT_OWN            = "POST_EDIT_OWN";

    /** DELETE /posts/{id} — delete own post (ownership enforced in service) */
    public static final String POST_DELETE_OWN          = "POST_DELETE_OWN";

    /** DELETE /posts/{id} — delete any post for moderation (HR / CEO) */
    public static final String POST_DELETE_ANY          = "POST_DELETE_ANY";

    /** PATCH /posts/{id}/pin — pin or unpin a post within own team's feed */
    public static final String POST_PIN_IN_TEAM         = "POST_PIN_IN_TEAM";

    /** PATCH /posts/{id}/pin — pin or unpin a post within own department's feed */
    public static final String POST_PIN_IN_DEPT         = "POST_PIN_IN_DEPT";

    /** PATCH /posts/{id}/pin — pin or unpin any post (CEO only) */
    public static final String POST_PIN_ANY             = "POST_PIN_ANY";

    /** GET/POST/DELETE /posts/saved/** — bookmark or unbookmark posts */
    public static final String POST_SAVE                = "POST_SAVE";


    // =========================================================================
    // ── POST-SERVICE : Comments ───────────────────────────────────────────────
    // =========================================================================

    /** GET /posts/{id}/comments — view comments and replies */
    public static final String COMMENT_VIEW             = "COMMENT_VIEW";

    /** POST /posts/{id}/comments — add a comment */
    public static final String COMMENT_CREATE           = "COMMENT_CREATE";

    /** PUT /posts/{id}/comments/{cid} — edit own comment */
    public static final String COMMENT_EDIT_OWN         = "COMMENT_EDIT_OWN";

    /** DELETE /posts/{id}/comments/{cid} — delete own comment */
    public static final String COMMENT_DELETE_OWN       = "COMMENT_DELETE_OWN";

    /** DELETE /posts/{id}/comments/{cid} — delete any comment for moderation (Dept Leader, HR, CEO) */
    public static final String COMMENT_DELETE_ANY       = "COMMENT_DELETE_ANY";


    // =========================================================================
    // ── POST-SERVICE : Reactions ──────────────────────────────────────────────
    // =========================================================================

    /** POST /posts/{id}/reactions — react to a post, or GET to view reactions */
    public static final String POST_REACT               = "POST_REACT";

    /** POST /posts/{id}/comments/{cid}/reactions — react to a comment, or GET to view reactions */
    public static final String COMMENT_REACT            = "COMMENT_REACT";

    /** GET /reaction-types — list available emoji reaction types */
    public static final String REACTION_TYPE_VIEW       = "REACTION_TYPE_VIEW";

    /** POST /reaction-types — add a new emoji reaction type (CEO only) */
    public static final String REACTION_TYPE_CREATE     = "REACTION_TYPE_CREATE";

    /** DELETE /reaction-types/{id} — remove a reaction type (CEO only) */
    public static final String REACTION_TYPE_DELETE     = "REACTION_TYPE_DELETE";


    // =========================================================================
    // ── POST-SERVICE : Attachments ────────────────────────────────────────────
    // =========================================================================

    /** GET  /posts/{id}/attachments — view file attachments on a post */
    public static final String ATTACHMENT_VIEW          = "ATTACHMENT_VIEW";

    /** POST /posts/{id}/attachments — upload a file to a post */
    public static final String ATTACHMENT_UPLOAD        = "ATTACHMENT_UPLOAD";

    /** DELETE /posts/{id}/attachments/{aid} — delete own attachment */
    public static final String ATTACHMENT_DELETE_OWN    = "ATTACHMENT_DELETE_OWN";


    // =========================================================================
    // ── POST-SERVICE : Surveys ────────────────────────────────────────────────
    // =========================================================================

    /** POST /posts/{id}/survey/vote — cast or change a vote on a survey post */
    public static final String SURVEY_VOTE              = "SURVEY_VOTE";
}
