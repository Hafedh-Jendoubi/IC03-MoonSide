package tn.moonside.organizationservice.dtos.responses;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserTeamResponse {
    private String id;
    private String userId;
    private String teamId;
    private UserSummary user;
    private LocalDateTime joinedAt;
}
