package tn.moonside.userservice.dtos.responses;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * A connection or pending connection request, with a lightweight summary of
 * "the other person" embedded so the frontend doesn't need a second round
 * trip to render names/avatars in a requests list.
 */
@Data
@Builder
public class ConnectionResponse {
    private String id;
    private String requesterId;
    private String receiverId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;

    /** Summary of whichever side of the connection ISN'T the caller. */
    private UserSummaryResponse otherUser;
}
