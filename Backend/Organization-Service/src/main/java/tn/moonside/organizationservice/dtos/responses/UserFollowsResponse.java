package tn.moonside.organizationservice.dtos.responses;

import lombok.*;

import java.util.List;

/**
 * Represents all the departments and teams that a single user is currently
 * following <b>plus</b> the teams the user is a member of and the departments
 * those teams belong to.
 *
 * <p>Returned by GET /organizations/follows/mine and consumed by Post-Service
 * to build a personalised feed that automatically includes content from a
 * user's own team(s) and their parent department(s).</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFollowsResponse {

    /** IDs of departments the user explicitly follows. Never null; may be empty. */
    @Builder.Default
    private List<String> followedDepartmentIds = List.of();

    /** IDs of teams the user explicitly follows. Never null; may be empty. */
    @Builder.Default
    private List<String> followedTeamIds = List.of();

    /**
     * IDs of teams where the user is a member (joined or assigned).
     * These are surfaced automatically — the user does not need to follow them.
     * Never null; may be empty.
     */
    @Builder.Default
    private List<String> memberTeamIds = List.of();

    /**
     * IDs of departments that contain at least one team the user is a member of.
     * These are surfaced automatically — the user does not need to follow them.
     * Never null; may be empty.
     */
    @Builder.Default
    private List<String> memberDepartmentIds = List.of();
}
