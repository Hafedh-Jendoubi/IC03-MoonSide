package tn.moonside.organizationservice.dtos.responses;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * A single team membership — the team itself plus when the user joined it.
 * Used by the "Recent Activity" section on a user's profile page to show
 * "Joined <team>" (and, via team.departmentName, its parent department).
 */
@Data
@Builder
public class TeamMembershipResponse {
    private TeamResponse team;
    private LocalDateTime joinedAt;
}
