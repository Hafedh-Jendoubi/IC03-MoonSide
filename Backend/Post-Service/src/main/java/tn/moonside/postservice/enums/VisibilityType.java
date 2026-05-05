package tn.moonside.postservice.enums;

/**
 * Visibility levels for a post.
 *
 * <ul>
 *   <li>{@code PUBLIC}            – visible to everyone.</li>
 *   <li>{@code PRIVATE}           – visible only to the author.</li>
 *   <li>{@code TEAM_ONLY}         – set automatically when a post is created inside a team feed.</li>
 *   <li>{@code DEPARTMENT_ONLY}   – set automatically when a post is created inside a department feed.</li>
 *   <li>{@code DRAFT}             – work-in-progress, not yet published.</li>
 * </ul>
 *
 * Clients may only submit {@code PUBLIC} or {@code PRIVATE}.
 * The server derives {@code TEAM_ONLY} / {@code DEPARTMENT_ONLY} from context.
 */
public enum VisibilityType {
    PUBLIC,
    PRIVATE,
    TEAM_ONLY,
    DEPARTMENT_ONLY,
    DRAFT
}
