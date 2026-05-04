package tn.moonside.organizationservice.audit;

/**
 * Canonical action strings for Organisation-Service audit events.
 *
 * Naming convention mirrors the User-Service pattern:
 *   <NOUN>_<VERB>  (e.g. TEAM_CREATED, DEPARTMENT_MEMBER_ADDED)
 *
 * These values are stored verbatim in the shared audit_logs MongoDB collection
 * and are the values you filter on in the back-office (/audit-logs?action=…).
 */
public final class OrgAuditAction {

    private OrgAuditAction() {}

    // ── Department ────────────────────────────────────────────────────────────
    public static final String DEPARTMENT_CREATED       = "DEPARTMENT_CREATED";
    public static final String DEPARTMENT_UPDATED       = "DEPARTMENT_UPDATED";
    public static final String DEPARTMENT_DELETED       = "DEPARTMENT_DELETED";
    public static final String DEPARTMENT_ACTIVATED     = "DEPARTMENT_ACTIVATED";
    public static final String DEPARTMENT_DEACTIVATED   = "DEPARTMENT_DEACTIVATED";
    public static final String DEPARTMENT_MANAGER_ASSIGNED = "DEPARTMENT_MANAGER_ASSIGNED";
    public static final String DEPARTMENT_MANAGER_REMOVED  = "DEPARTMENT_MANAGER_REMOVED";
    public static final String DEPARTMENT_FOLLOWED      = "DEPARTMENT_FOLLOWED";
    public static final String DEPARTMENT_UNFOLLOWED    = "DEPARTMENT_UNFOLLOWED";
    public static final String DEPARTMENT_AVATAR_UPDATED = "DEPARTMENT_AVATAR_UPDATED";
    public static final String DEPARTMENT_BANNER_UPDATED = "DEPARTMENT_BANNER_UPDATED";

    // ── Team ──────────────────────────────────────────────────────────────────
    public static final String TEAM_CREATED             = "TEAM_CREATED";
    public static final String TEAM_UPDATED             = "TEAM_UPDATED";
    public static final String TEAM_DELETED             = "TEAM_DELETED";
    public static final String TEAM_LEAD_ASSIGNED       = "TEAM_LEAD_ASSIGNED";
    public static final String TEAM_LEAD_REMOVED        = "TEAM_LEAD_REMOVED";
    public static final String TEAM_MEMBER_ADDED        = "TEAM_MEMBER_ADDED";
    public static final String TEAM_MEMBER_REMOVED      = "TEAM_MEMBER_REMOVED";
    public static final String TEAM_MEMBER_ASSIGNED     = "TEAM_MEMBER_ASSIGNED";
    public static final String TEAM_JOINED              = "TEAM_JOINED";
    public static final String TEAM_LEFT                = "TEAM_LEFT";
    public static final String TEAM_FOLLOWED            = "TEAM_FOLLOWED";
    public static final String TEAM_UNFOLLOWED          = "TEAM_UNFOLLOWED";
    public static final String TEAM_AVATAR_UPDATED      = "TEAM_AVATAR_UPDATED";
    public static final String TEAM_BANNER_UPDATED      = "TEAM_BANNER_UPDATED";
}
