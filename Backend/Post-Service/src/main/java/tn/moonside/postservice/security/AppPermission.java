package tn.moonside.postservice.security;

/**
 * Central registry of every Post-Service endpoint permission.
 *
 * Naming convention:  <RESOURCE>_<ACTION>[_<SCOPE>]
 * These strings must also be declared in User-Service's AppPermission and seeded
 * into the permissions collection via DataSeeder so that the admin/roles page can
 * assign them to roles.
 *
 * Role → Permission mapping (who can do what by default)
 * ─────────────────────────────────────────────────────────────────────────────
 *  EMPLOYEE          — Read feeds/posts, react, comment, save posts, vote surveys
 *  TEAM_LEADER       — Everything EMPLOYEE can + pin posts in own team
 *  DEPARTMENT_LEADER — Everything TEAM_LEADER can + pin posts in own department
 *  HUMAN_RESOURCES   — Read feeds only (no mutations)
 *  CEO               — Unrestricted via ANYTHING wildcard (already set)
 */
public final class AppPermission {

    private AppPermission() {}

    // ─── Posts ────────────────────────────────────────────────────────────────

    /** POST /posts — create a new post */
    public static final String POST_CREATE           = "POST_CREATE";

    /** GET /posts/feed, /posts/author/**, /posts/team/**, /posts/department/**, /posts/{id} */
    public static final String POST_READ             = "POST_READ";

    /** PUT /posts/{id} — edit own post (ownership enforced in service) */
    public static final String POST_UPDATE_OWN       = "POST_UPDATE_OWN";

    /** DELETE /posts/{id} — delete own post (ownership enforced in service) */
    public static final String POST_DELETE_OWN       = "POST_DELETE_OWN";

    /** DELETE /posts/{id} — delete ANY post (moderation; CEO / HR) */
    public static final String POST_DELETE_ANY       = "POST_DELETE_ANY";

    /** PATCH /posts/{id}/pin — pin/unpin a post within own team scope */
    public static final String POST_PIN_TEAM         = "POST_PIN_TEAM";

    /** PATCH /posts/{id}/pin — pin/unpin a post within own department scope */
    public static final String POST_PIN_DEPARTMENT   = "POST_PIN_DEPARTMENT";

    /** PATCH /posts/{id}/pin — pin/unpin ANY post (CEO only) */
    public static final String POST_PIN_ANY          = "POST_PIN_ANY";

    // ─── Comments ─────────────────────────────────────────────────────────────

    /** POST /posts/{id}/comments — add a comment */
    public static final String COMMENT_CREATE        = "COMMENT_CREATE";

    /** GET /posts/{id}/comments — read comments & replies */
    public static final String COMMENT_READ          = "COMMENT_READ";

    /** PUT /posts/{id}/comments/{cid} — edit own comment */
    public static final String COMMENT_UPDATE_OWN    = "COMMENT_UPDATE_OWN";

    /** DELETE /posts/{id}/comments/{cid} — delete own comment */
    public static final String COMMENT_DELETE_OWN    = "COMMENT_DELETE_OWN";

    /** DELETE /posts/{id}/comments/{cid} — delete ANY comment (moderation) */
    public static final String COMMENT_DELETE_ANY    = "COMMENT_DELETE_ANY";

    // ─── Reactions ────────────────────────────────────────────────────────────

    /** POST/GET /posts/{id}/reactions — react to a post or view reactions */
    public static final String REACTION_POST         = "REACTION_POST";

    /** POST/GET /posts/{id}/comments/{cid}/reactions — react to a comment */
    public static final String REACTION_COMMENT      = "REACTION_COMMENT";

    // ─── Reaction Types (admin) ───────────────────────────────────────────────

    /** GET /reaction-types — list available reaction types */
    public static final String REACTION_TYPE_READ    = "REACTION_TYPE_READ";

    /** POST /reaction-types — create a new reaction type (CEO only) */
    public static final String REACTION_TYPE_CREATE  = "REACTION_TYPE_CREATE";

    /** DELETE /reaction-types/{id} — delete a reaction type (CEO only) */
    public static final String REACTION_TYPE_DELETE  = "REACTION_TYPE_DELETE";

    // ─── Attachments ─────────────────────────────────────────────────────────

    /** POST /posts/{id}/attachments — upload a file to a post */
    public static final String ATTACHMENT_UPLOAD     = "ATTACHMENT_UPLOAD";

    /** GET /posts/{id}/attachments — list attachments */
    public static final String ATTACHMENT_READ       = "ATTACHMENT_READ";

    /** DELETE /posts/{id}/attachments/{aid} — delete own attachment */
    public static final String ATTACHMENT_DELETE_OWN = "ATTACHMENT_DELETE_OWN";

    // ─── Saved Posts ──────────────────────────────────────────────────────────

    /** GET/POST/DELETE /posts/saved/** — bookmark management */
    public static final String POST_SAVE             = "POST_SAVE";

    // ─── Surveys ─────────────────────────────────────────────────────────────

    /** POST /posts/{id}/survey/vote — cast/change vote on a survey post */
    public static final String SURVEY_VOTE           = "SURVEY_VOTE";
}
