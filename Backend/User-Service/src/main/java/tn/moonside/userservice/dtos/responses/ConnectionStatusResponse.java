package tn.moonside.userservice.dtos.responses;

import lombok.Builder;
import lombok.Data;

/**
 * Describes the relationship between the caller and another user — used to
 * decide which button/state to render on a profile page (Connect / Pending /
 * Respond / Connected).
 */
@Data
@Builder
public class ConnectionStatusResponse {

    public enum Status {
        /** No connection or request exists between the two users. */
        NONE,
        /** The caller sent a request that is still awaiting a response. */
        PENDING_SENT,
        /** The other user sent a request that the caller hasn't responded to yet. */
        PENDING_RECEIVED,
        /** The two users are connected. */
        CONNECTED,
        /** The other user IS the caller. */
        SELF
    }

    private Status status;
    /** Null when status is NONE or SELF. */
    private String connectionId;
}
