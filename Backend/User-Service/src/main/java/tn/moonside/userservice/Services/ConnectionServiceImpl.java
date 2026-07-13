package tn.moonside.userservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.moonside.userservice.dtos.responses.ConnectionResponse;
import tn.moonside.userservice.dtos.responses.ConnectionStatusResponse;
import tn.moonside.userservice.dtos.responses.UserSummaryResponse;
import tn.moonside.userservice.entities.Connection;
import tn.moonside.userservice.entities.ConnectionStatus;
import tn.moonside.userservice.entities.User;
import tn.moonside.userservice.event.NotificationEvent;
import tn.moonside.userservice.event.UserActivityEvent;
import tn.moonside.userservice.exceptions.DuplicateResourceException;
import tn.moonside.userservice.exceptions.ResourceNotFoundException;
import tn.moonside.userservice.exceptions.UnauthorizedException;
import tn.moonside.userservice.kafka.NotificationEventPublisher;
import tn.moonside.userservice.kafka.UserActivityEventPublisher;
import tn.moonside.userservice.repositories.ConnectionRepository;
import tn.moonside.userservice.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConnectionServiceImpl implements ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final NotificationEventPublisher notificationPublisher;
    private final UserActivityEventPublisher userActivityPublisher;

    @Override
    public ConnectionResponse sendRequest(String requesterId, String receiverId) {
        if (requesterId.equals(receiverId)) {
            throw new DuplicateResourceException("You can't connect with yourself");
        }

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + receiverId));

        var existing = connectionRepository.findBetween(requesterId, receiverId);

        if (existing.isPresent()) {
            Connection conn = existing.get();
            if (conn.getStatus() == ConnectionStatus.ACCEPTED) {
                throw new DuplicateResourceException("You are already connected with this user");
            }
            // PENDING already exists
            if (conn.getRequesterId().equals(requesterId)) {
                throw new DuplicateResourceException("Connection request already sent");
            }
            // The other person already requested us first — accept it instead of
            // creating a duplicate/contradictory pending pair.
            return acceptRequest(conn.getId(), requesterId);
        }

        Connection saved = connectionRepository.save(Connection.builder()
                .requesterId(requesterId)
                .receiverId(receiverId)
                .status(ConnectionStatus.PENDING)
                .build());

        User requester = userRepository.findById(requesterId).orElse(null);
        String requesterName = displayName(requester, requesterId);

        notificationPublisher.publish(NotificationEvent.builder()
                .recipientId(receiverId)
                .senderId(requesterId)
                .notificationType("CONNECTION_REQUEST")
                .title(requesterName + " sent you a connection request")
                .body(requesterName + " wants to connect with you")
                .resourceId(saved.getId())
                .resourceType("CONNECTION")
                .build());

        return toResponse(saved, requesterId, receiver);
    }

    @Override
    public ConnectionResponse acceptRequest(String connectionId, String currentUserId) {
        Connection conn = findConnection(connectionId);

        if (!conn.getReceiverId().equals(currentUserId)) {
            throw new UnauthorizedException("Only the recipient can accept a connection request");
        }
        if (conn.getStatus() == ConnectionStatus.ACCEPTED) {
            return toResponse(conn, currentUserId, null);
        }

        conn.setStatus(ConnectionStatus.ACCEPTED);
        conn.setRespondedAt(LocalDateTime.now());
        conn.setUpdatedAt(LocalDateTime.now());
        Connection saved = connectionRepository.save(conn);

        User accepter = userRepository.findById(currentUserId).orElse(null);
        String accepterName = displayName(accepter, currentUserId);

        notificationPublisher.publish(NotificationEvent.builder()
                .recipientId(conn.getRequesterId())
                .senderId(currentUserId)
                .notificationType("CONNECTION_ACCEPTED")
                .title(accepterName + " accepted your connection request")
                .body("You and " + accepterName + " are now connected")
                .resourceId(saved.getId())
                .resourceType("CONNECTION")
                .build());

        // Publish badge-relevant events for both parties
        long requesterCount = connectionRepository.countAcceptedForUser(conn.getRequesterId());
        long accepterCount  = connectionRepository.countAcceptedForUser(currentUserId);
        userActivityPublisher.publish(UserActivityEvent.builder()
                .userId(conn.getRequesterId())
                .activityType("CONNECTION_ACCEPTED")
                .value((int) requesterCount)
                .build());
        userActivityPublisher.publish(UserActivityEvent.builder()
                .userId(currentUserId)
                .activityType("CONNECTION_ACCEPTED")
                .value((int) accepterCount)
                .build());

        return toResponse(saved, currentUserId, null);
    }

    @Override
    public void declineOrCancel(String connectionId, String currentUserId) {
        Connection conn = findConnection(connectionId);

        boolean isParty = conn.getRequesterId().equals(currentUserId)
                || conn.getReceiverId().equals(currentUserId);
        if (!isParty) {
            throw new UnauthorizedException("You are not part of this connection request");
        }
        if (conn.getStatus() != ConnectionStatus.PENDING) {
            throw new DuplicateResourceException("This connection is already accepted — use remove instead");
        }

        connectionRepository.delete(conn);
    }

    @Override
    public void removeConnection(String connectionId, String currentUserId) {
        Connection conn = findConnection(connectionId);

        boolean isParty = conn.getRequesterId().equals(currentUserId)
                || conn.getReceiverId().equals(currentUserId);
        if (!isParty) {
            throw new UnauthorizedException("You are not part of this connection");
        }

        connectionRepository.delete(conn);
    }

    @Override
    public List<UserSummaryResponse> getConnections(String userId) {
        List<String> otherIds = getConnectionIds(userId);
        if (otherIds.isEmpty()) return List.of();

        Map<String, User> usersById = userRepository.findAllById(otherIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return otherIds.stream()
                .map(usersById::get)
                .filter(java.util.Objects::nonNull)
                .map(this::toSummary)
                .toList();
    }

    @Override
    public List<ConnectionResponse> getConnectionsWithDates(String userId) {
        List<Connection> accepted = connectionRepository.findAllAcceptedForUser(userId);
        return enrichWithOtherUser(accepted, userId);
    }

    @Override
    public List<String> getConnectionIds(String userId) {
        return connectionRepository.findAllAcceptedForUser(userId).stream()
                .map(c -> c.getRequesterId().equals(userId) ? c.getReceiverId() : c.getRequesterId())
                .distinct()
                .toList();
    }

    @Override
    public List<ConnectionResponse> getPendingReceived(String userId) {
        List<Connection> pending = connectionRepository.findByReceiverIdAndStatus(userId, ConnectionStatus.PENDING);
        return enrichWithOtherUser(pending, userId);
    }

    @Override
    public List<ConnectionResponse> getPendingSent(String userId) {
        List<Connection> pending = connectionRepository.findByRequesterIdAndStatus(userId, ConnectionStatus.PENDING);
        return enrichWithOtherUser(pending, userId);
    }

    @Override
    public long getConnectionCount(String userId) {
        return connectionRepository.countAcceptedForUser(userId);
    }

    @Override
    public ConnectionStatusResponse getStatus(String currentUserId, String otherUserId) {
        if (currentUserId.equals(otherUserId)) {
            return ConnectionStatusResponse.builder()
                    .status(ConnectionStatusResponse.Status.SELF)
                    .build();
        }

        var existing = connectionRepository.findBetween(currentUserId, otherUserId);
        if (existing.isEmpty()) {
            return ConnectionStatusResponse.builder()
                    .status(ConnectionStatusResponse.Status.NONE)
                    .build();
        }

        Connection conn = existing.get();
        if (conn.getStatus() == ConnectionStatus.ACCEPTED) {
            return ConnectionStatusResponse.builder()
                    .status(ConnectionStatusResponse.Status.CONNECTED)
                    .connectionId(conn.getId())
                    .build();
        }

        ConnectionStatusResponse.Status status = conn.getRequesterId().equals(currentUserId)
                ? ConnectionStatusResponse.Status.PENDING_SENT
                : ConnectionStatusResponse.Status.PENDING_RECEIVED;

        return ConnectionStatusResponse.builder()
                .status(status)
                .connectionId(conn.getId())
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Connection findConnection(String connectionId) {
        return connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection request not found: " + connectionId));
    }

    private List<ConnectionResponse> enrichWithOtherUser(List<Connection> connections, String currentUserId) {
        if (connections.isEmpty()) return List.of();

        List<String> otherIds = connections.stream()
                .map(c -> c.getRequesterId().equals(currentUserId) ? c.getReceiverId() : c.getRequesterId())
                .distinct()
                .toList();

        Map<String, User> usersById = userRepository.findAllById(otherIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return connections.stream()
                .map(c -> {
                    String otherId = c.getRequesterId().equals(currentUserId) ? c.getReceiverId() : c.getRequesterId();
                    return toResponse(c, currentUserId, usersById.get(otherId));
                })
                .toList();
    }

    private ConnectionResponse toResponse(Connection conn, String currentUserId, User knownOtherUser) {
        String otherId = conn.getRequesterId().equals(currentUserId) ? conn.getReceiverId() : conn.getRequesterId();
        User otherUser = knownOtherUser != null ? knownOtherUser : userRepository.findById(otherId).orElse(null);

        return ConnectionResponse.builder()
                .id(conn.getId())
                .requesterId(conn.getRequesterId())
                .receiverId(conn.getReceiverId())
                .status(conn.getStatus().name())
                .createdAt(conn.getCreatedAt())
                .respondedAt(conn.getRespondedAt())
                .otherUser(otherUser != null ? toSummary(otherUser) : null)
                .build();
    }

    private UserSummaryResponse toSummary(User u) {
        return UserSummaryResponse.builder()
                .id(u.getId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .jobTitle(u.getJobTitle())
                .avatar(u.getAvatar())
                .build();
    }

    private String displayName(User u, String fallbackId) {
        if (u == null) return fallbackId;
        if (u.getFirstName() != null && u.getLastName() != null) {
            return u.getFirstName() + " " + u.getLastName();
        }
        return u.getEmail() != null ? u.getEmail() : fallbackId;
    }
}
