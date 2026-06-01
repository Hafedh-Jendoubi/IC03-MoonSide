package tn.moonside.postservice.audit;

public final class PostAuditAction {

    private PostAuditAction() {}

    // ── Post ──────────────────────────────────────────────────────────────────
    public static final String POST_CREATED              = "POST_CREATED";
    public static final String POST_UPDATED              = "POST_UPDATED";
    public static final String POST_DELETED              = "POST_DELETED";
    public static final String POST_PINNED               = "POST_PINNED";
    public static final String POST_UNPINNED             = "POST_UNPINNED";

    // ── Comment ───────────────────────────────────────────────────────────────
    public static final String COMMENT_ADDED             = "COMMENT_ADDED";
    public static final String COMMENT_UPDATED           = "COMMENT_UPDATED";
    public static final String COMMENT_DELETED           = "COMMENT_DELETED";

    // ── Reaction ──────────────────────────────────────────────────────────────
    public static final String REACTION_ADDED            = "REACTION_ADDED";
    public static final String REACTION_CHANGED          = "REACTION_CHANGED";
    public static final String REACTION_REMOVED          = "REACTION_REMOVED";

    // ── Saved Post ────────────────────────────────────────────────────────────
    public static final String POST_SAVED                = "POST_SAVED";
    public static final String POST_UNSAVED              = "POST_UNSAVED";
}
