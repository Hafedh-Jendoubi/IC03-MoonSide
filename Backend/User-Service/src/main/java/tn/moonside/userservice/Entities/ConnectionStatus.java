package tn.moonside.userservice.entities;

/**
 * Lifecycle of a {@link Connection} between two users.
 *
 * There is no DECLINED state on purpose: declining a request simply deletes
 * the record, which lets either person send a fresh request later instead of
 * being stuck behind a permanent "declined" record.
 */
public enum ConnectionStatus {
    /** Request sent by {@code requesterId}, awaiting a decision from {@code receiverId}. */
    PENDING,
    /** Both users are connected. */
    ACCEPTED
}
