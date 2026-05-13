package tn.moonside.organizationservice.dtos.responses;

import lombok.*;

import java.util.List;

/**
 * Represents all the departments and teams that a single user is currently
 * following. Returned by GET /organizations/follows/mine and consumed by
 * Post-Service to build a personalised feed.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFollowsResponse {

    /** IDs of departments the user follows. Never null; may be empty. */
    @Builder.Default
    private List<String> followedDepartmentIds = List.of();

    /** IDs of teams the user follows. Never null; may be empty. */
    @Builder.Default
    private List<String> followedTeamIds = List.of();
}
