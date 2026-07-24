package tn.moonside.userservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Represents a connection (or pending connection request) between two users —
 * the social-network analogue of a LinkedIn "connection".
 *
 * <p>{@code requesterId} is whoever clicked "Connect" first; {@code receiverId}
 * is the person who must accept or decline. Once accepted, the relationship is
 * symmetric: both users see each other in their connections list and in each
 * other's feeds.</p>
 */
@Document(collection = "connections")
@CompoundIndexes({
    @CompoundIndex(name = "requester_receiver_idx", def = "{'requesterId': 1, 'receiverId': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Connection {

    @Id
    private String id;

    @Indexed
    private String requesterId;

    @Indexed
    private String receiverId;

    @Builder.Default
    private ConnectionStatus status = ConnectionStatus.PENDING;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    /** Set when the request transitions from PENDING to ACCEPTED. */
    private LocalDateTime respondedAt;
}
