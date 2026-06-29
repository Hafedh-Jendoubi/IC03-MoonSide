package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.responses.ConnectionResponse;
import tn.moonside.userservice.dtos.responses.ConnectionStatusResponse;
import tn.moonside.userservice.dtos.responses.UserSummaryResponse;

import java.util.List;

public interface ConnectionService {

    /** Sends a connection request from {@code requesterId} to {@code receiverId}. */
    ConnectionResponse sendRequest(String requesterId, String receiverId);

    /** Accepts a pending request. Only the receiver may accept. */
    ConnectionResponse acceptRequest(String connectionId, String currentUserId);

    /**
     * Declines a pending request (receiver) or cancels a request you sent
     * (requester) — either way the record is deleted, freeing both users to
     * send a new request later.
     */
    void declineOrCancel(String connectionId, String currentUserId);

    /** Removes an existing (ACCEPTED) connection. Either party may do this. */
    void removeConnection(String connectionId, String currentUserId);

    /** All accepted connections for a user, as lightweight user summaries. */
    List<UserSummaryResponse> getConnections(String userId);

    /** Just the IDs of a user's connections — used by other services (e.g. Post-Service feed). */
    List<String> getConnectionIds(String userId);

    /** Pending requests received by this user, awaiting their decision. */
    List<ConnectionResponse> getPendingReceived(String userId);

    /** Pending requests this user sent, awaiting the other person's decision. */
    List<ConnectionResponse> getPendingSent(String userId);

    /** Total number of accepted connections for a user — shown on their profile. */
    long getConnectionCount(String userId);

    /** The relationship between {@code currentUserId} and {@code otherUserId}. */
    ConnectionStatusResponse getStatus(String currentUserId, String otherUserId);
}
