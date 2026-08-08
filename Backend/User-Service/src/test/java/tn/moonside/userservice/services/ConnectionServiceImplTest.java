package tn.moonside.userservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.moonside.userservice.dtos.responses.ConnectionResponse;
import tn.moonside.userservice.dtos.responses.ConnectionStatusResponse;
import tn.moonside.userservice.entities.Connection;
import tn.moonside.userservice.entities.ConnectionStatus;
import tn.moonside.userservice.entities.User;
import tn.moonside.userservice.exceptions.DuplicateResourceException;
import tn.moonside.userservice.exceptions.ResourceNotFoundException;
import tn.moonside.userservice.exceptions.UnauthorizedException;
import tn.moonside.userservice.kafka.NotificationEventPublisher;
import tn.moonside.userservice.kafka.UserActivityEventPublisher;
import tn.moonside.userservice.repositories.ConnectionRepository;
import tn.moonside.userservice.repositories.UserRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConnectionServiceImplTest {

    @Mock private ConnectionRepository connectionRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationEventPublisher notificationPublisher;
    @Mock private UserActivityEventPublisher userActivityPublisher;

    @InjectMocks
    private ConnectionServiceImpl connectionService;

    private User requester;
    private User receiver;

    @BeforeEach
    void setUp() {
        requester = User.builder().id("u1").firstName("John").lastName("Doe").email("john@x.com").build();
        receiver = User.builder().id("u2").firstName("Jane").lastName("Smith").email("jane@x.com").build();
    }

    @Test
    void sendRequest_toSelf_throws() {
        assertThatThrownBy(() -> connectionService.sendRequest("u1", "u1"))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void sendRequest_receiverNotFound_throws() {
        when(userRepository.findById("u2")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> connectionService.sendRequest("u1", "u2"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void sendRequest_newConnection_success() {
        when(userRepository.findById("u2")).thenReturn(Optional.of(receiver));
        when(connectionRepository.findBetween("u1", "u2")).thenReturn(Optional.empty());
        when(connectionRepository.save(any(Connection.class))).thenAnswer(inv -> {
            Connection c = inv.getArgument(0);
            c.setId("c1");
            return c;
        });
        when(userRepository.findById("u1")).thenReturn(Optional.of(requester));

        ConnectionResponse response = connectionService.sendRequest("u1", "u2");

        assertThat(response.getId()).isEqualTo("c1");
        assertThat(response.getStatus()).isEqualTo("PENDING");
        verify(notificationPublisher).publish(any());
    }

    @Test
    void sendRequest_alreadyAccepted_throws() {
        Connection existing = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.ACCEPTED).build();

        when(userRepository.findById("u2")).thenReturn(Optional.of(receiver));
        when(connectionRepository.findBetween("u1", "u2")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> connectionService.sendRequest("u1", "u2"))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void sendRequest_alreadyPendingSameRequester_throws() {
        Connection existing = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.PENDING).build();

        when(userRepository.findById("u2")).thenReturn(Optional.of(receiver));
        when(connectionRepository.findBetween("u1", "u2")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> connectionService.sendRequest("u1", "u2"))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void sendRequest_reversePending_autoAccepts() {
        Connection existing = Connection.builder().id("c1").requesterId("u2").receiverId("u1")
                .status(ConnectionStatus.PENDING).build();

        when(userRepository.findById("u2")).thenReturn(Optional.of(receiver));
        when(connectionRepository.findBetween("u1", "u2")).thenReturn(Optional.of(existing));
        when(connectionRepository.findById("c1")).thenReturn(Optional.of(existing));
        when(connectionRepository.save(any(Connection.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById("u1")).thenReturn(Optional.of(requester));
        when(connectionRepository.countAcceptedForUser(anyString())).thenReturn(1L);

        ConnectionResponse response = connectionService.sendRequest("u1", "u2");

        assertThat(response.getStatus()).isEqualTo("ACCEPTED");
    }

    @Test
    void acceptRequest_success() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.PENDING).build();

        when(connectionRepository.findById("c1")).thenReturn(Optional.of(conn));
        when(connectionRepository.save(any(Connection.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById("u2")).thenReturn(Optional.of(receiver));
        when(connectionRepository.countAcceptedForUser(anyString())).thenReturn(1L);

        ConnectionResponse response = connectionService.acceptRequest("c1", "u2");

        assertThat(response.getStatus()).isEqualTo("ACCEPTED");
        verify(notificationPublisher).publish(any());
        verify(userActivityPublisher, times(2)).publish(any());
    }

    @Test
    void acceptRequest_notRecipient_throws() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.PENDING).build();

        when(connectionRepository.findById("c1")).thenReturn(Optional.of(conn));

        assertThatThrownBy(() -> connectionService.acceptRequest("c1", "u3"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void acceptRequest_alreadyAccepted_returnsAsIs() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.ACCEPTED).build();

        when(connectionRepository.findById("c1")).thenReturn(Optional.of(conn));

        ConnectionResponse response = connectionService.acceptRequest("c1", "u2");

        assertThat(response.getStatus()).isEqualTo("ACCEPTED");
        verify(connectionRepository, never()).save(any());
    }

    @Test
    void acceptRequest_connectionNotFound_throws() {
        when(connectionRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> connectionService.acceptRequest("missing", "u2"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void declineOrCancel_success() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.PENDING).build();
        when(connectionRepository.findById("c1")).thenReturn(Optional.of(conn));

        connectionService.declineOrCancel("c1", "u1");

        verify(connectionRepository).delete(conn);
    }

    @Test
    void declineOrCancel_notParty_throws() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.PENDING).build();
        when(connectionRepository.findById("c1")).thenReturn(Optional.of(conn));

        assertThatThrownBy(() -> connectionService.declineOrCancel("c1", "u3"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void declineOrCancel_alreadyAccepted_throws() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.ACCEPTED).build();
        when(connectionRepository.findById("c1")).thenReturn(Optional.of(conn));

        assertThatThrownBy(() -> connectionService.declineOrCancel("c1", "u1"))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void removeConnection_success() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.ACCEPTED).build();
        when(connectionRepository.findById("c1")).thenReturn(Optional.of(conn));

        connectionService.removeConnection("c1", "u2");

        verify(connectionRepository).delete(conn);
    }

    @Test
    void removeConnection_notParty_throws() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.ACCEPTED).build();
        when(connectionRepository.findById("c1")).thenReturn(Optional.of(conn));

        assertThatThrownBy(() -> connectionService.removeConnection("c1", "u3"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void getConnections_empty_returnsEmptyList() {
        when(connectionRepository.findAllAcceptedForUser("u1")).thenReturn(List.of());

        List<?> result = connectionService.getConnections("u1");

        assertThat(result).isEmpty();
    }

    @Test
    void getConnections_returnsSummaries() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.ACCEPTED).build();
        when(connectionRepository.findAllAcceptedForUser("u1")).thenReturn(List.of(conn));
        when(userRepository.findAllById(List.of("u2"))).thenReturn(List.of(receiver));

        var result = connectionService.getConnections("u1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("u2");
    }

    @Test
    void getConnectionsWithDates_returnsEnriched() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.ACCEPTED).build();
        when(connectionRepository.findAllAcceptedForUser("u1")).thenReturn(List.of(conn));
        when(userRepository.findAllById(List.of("u2"))).thenReturn(List.of(receiver));

        var result = connectionService.getConnectionsWithDates("u1");

        assertThat(result).hasSize(1);
    }

    @Test
    void getConnectionIds_returnsOtherIds() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.ACCEPTED).build();
        when(connectionRepository.findAllAcceptedForUser("u1")).thenReturn(List.of(conn));

        List<String> ids = connectionService.getConnectionIds("u1");

        assertThat(ids).containsExactly("u2");
    }

    @Test
    void getPendingReceived_returnsEnriched() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.PENDING).build();
        when(connectionRepository.findByReceiverIdAndStatus("u2", ConnectionStatus.PENDING))
                .thenReturn(List.of(conn));
        when(userRepository.findAllById(List.of("u1"))).thenReturn(List.of(requester));

        var result = connectionService.getPendingReceived("u2");

        assertThat(result).hasSize(1);
    }

    @Test
    void getPendingSent_returnsEnriched() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.PENDING).build();
        when(connectionRepository.findByRequesterIdAndStatus("u1", ConnectionStatus.PENDING))
                .thenReturn(List.of(conn));
        when(userRepository.findAllById(List.of("u2"))).thenReturn(List.of(receiver));

        var result = connectionService.getPendingSent("u1");

        assertThat(result).hasSize(1);
    }

    @Test
    void getConnectionCount_delegatesToRepository() {
        when(connectionRepository.countAcceptedForUser("u1")).thenReturn(5L);

        assertThat(connectionService.getConnectionCount("u1")).isEqualTo(5L);
    }

    @Test
    void getStatus_self_returnsSelf() {
        ConnectionStatusResponse response = connectionService.getStatus("u1", "u1");
        assertThat(response.getStatus()).isEqualTo(ConnectionStatusResponse.Status.SELF);
    }

    @Test
    void getStatus_none_returnsNone() {
        when(connectionRepository.findBetween("u1", "u2")).thenReturn(Optional.empty());

        ConnectionStatusResponse response = connectionService.getStatus("u1", "u2");

        assertThat(response.getStatus()).isEqualTo(ConnectionStatusResponse.Status.NONE);
    }

    @Test
    void getStatus_connected_returnsConnected() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.ACCEPTED).build();
        when(connectionRepository.findBetween("u1", "u2")).thenReturn(Optional.of(conn));

        ConnectionStatusResponse response = connectionService.getStatus("u1", "u2");

        assertThat(response.getStatus()).isEqualTo(ConnectionStatusResponse.Status.CONNECTED);
        assertThat(response.getConnectionId()).isEqualTo("c1");
    }

    @Test
    void getStatus_pendingSent_returnsPendingSent() {
        Connection conn = Connection.builder().id("c1").requesterId("u1").receiverId("u2")
                .status(ConnectionStatus.PENDING).build();
        when(connectionRepository.findBetween("u1", "u2")).thenReturn(Optional.of(conn));

        ConnectionStatusResponse response = connectionService.getStatus("u1", "u2");

        assertThat(response.getStatus()).isEqualTo(ConnectionStatusResponse.Status.PENDING_SENT);
    }

    @Test
    void getStatus_pendingReceived_returnsPendingReceived() {
        Connection conn = Connection.builder().id("c1").requesterId("u2").receiverId("u1")
                .status(ConnectionStatus.PENDING).build();
        when(connectionRepository.findBetween("u1", "u2")).thenReturn(Optional.of(conn));

        ConnectionStatusResponse response = connectionService.getStatus("u1", "u2");

        assertThat(response.getStatus()).isEqualTo(ConnectionStatusResponse.Status.PENDING_RECEIVED);
    }
}
