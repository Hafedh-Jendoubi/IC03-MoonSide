package tn.moonside.postservice.security;

/**
 * Post-Service permission constants — mirrors the Post-Service section of
 * User-Service's AppPermission.  Keep both files in sync.
 *
 * See User-Service AppPermission for the full naming-convention documentation.
 */
public final class AppPermission {

    private AppPermission() {}

    // ── Posts ─────────────────────────────────────────────────────────────────

    /** GET /posts/feed, /posts/{id}, /posts/author/**, /posts/team/**, /posts/department/** */
    public static final String POST_VIEW              = "POST_VIEW";

    /** POST /posts — create a post */
    public static final String POST_CREATE            = "POST_CREATE";

    /** PUT /posts/{id} — edit own post (ownership enforced in service) */
    public static final String POST_EDIT_OWN          = "POST_EDIT_OWN";

    /** DELETE /posts/{id} — delete own post (ownership enforced in service) */
    public static final String POST_DELETE_OWN        = "POST_DELETE_OWN";

    /** DELETE /posts/{id} — delete any post for moderation (HR / CEO) */
    public static final String POST_DELETE_ANY        = "POST_DELETE_ANY";

    /** PATCH /posts/{id}/pin — pin or unpin a post within own team's feed */
    public static final String POST_PIN_IN_TEAM       = "POST_PIN_IN_TEAM";

    /** PATCH /posts/{id}/pin — pin or unpin a post within own department's feed */
    public static final String POST_PIN_IN_DEPT       = "POST_PIN_IN_DEPT";

    /** PATCH /posts/{id}/pin — pin or unpin any post (CEO only) */
    public static final String POST_PIN_ANY           = "POST_PIN_ANY";

    /** GET/POST/DELETE /posts/saved/** — bookmark or unbookmark posts */
    public static final String POST_SAVE              = "POST_SAVE";

    // ── Comments ──────────────────────────────────────────────────────────────

    /** GET /posts/{id}/comments — view comments and replies */
    public static final String COMMENT_VIEW           = "COMMENT_VIEW";

    /** POST /posts/{id}/comments — add a comment */
    public static final String COMMENT_CREATE         = "COMMENT_CREATE";

    /** PUT /posts/{id}/comments/{cid} — edit own comment */
    public static final String COMMENT_EDIT_OWN       = "COMMENT_EDIT_OWN";

    /** DELETE /posts/{id}/comments/{cid} — delete own comment */
    public static final String COMMENT_DELETE_OWN     = "COMMENT_DELETE_OWN";

    /** DELETE /posts/{id}/comments/{cid} — delete any comment (Dept Leader, HR, CEO) */
    public static final String COMMENT_DELETE_ANY     = "COMMENT_DELETE_ANY";

    // ── Reactions ─────────────────────────────────────────────────────────────

    /** POST/GET /posts/{id}/reactions — react to a post or view its reactions */
    public static final String POST_REACT             = "POST_REACT";

    /** POST/GET /posts/{id}/comments/{cid}/reactions — react to a comment or view its reactions */
    public static final String COMMENT_REACT          = "COMMENT_REACT";

    // ── Reaction Types ────────────────────────────────────────────────────────

    /** GET /reaction-types — list available emoji reaction types */
    public static final String REACTION_TYPE_VIEW     = "REACTION_TYPE_VIEW";

    /** POST /reaction-types — add a new reaction type (CEO only) */
    public static final String REACTION_TYPE_CREATE   = "REACTION_TYPE_CREATE";

    /** DELETE /reaction-types/{id} — remove a reaction type (CEO only) */
    public static final String REACTION_TYPE_DELETE   = "REACTION_TYPE_DELETE";

    // ── Attachments ───────────────────────────────────────────────────────────

    /** GET  /posts/{id}/attachments — view file attachments on a post */
    public static final String ATTACHMENT_VIEW        = "ATTACHMENT_VIEW";

    /** POST /posts/{id}/attachments — upload a file attachment to a post */
    public static final String ATTACHMENT_UPLOAD      = "ATTACHMENT_UPLOAD";

    /** DELETE /posts/{id}/attachments/{aid} — delete own attachment */
    public static final String ATTACHMENT_DELETE_OWN  = "ATTACHMENT_DELETE_OWN";

    // ── Surveys ───────────────────────────────────────────────────────────────

    /** POST /posts/{id}/survey/vote — cast or change a vote on a survey post */
    public static final String SURVEY_VOTE            = "SURVEY_VOTE";
}
