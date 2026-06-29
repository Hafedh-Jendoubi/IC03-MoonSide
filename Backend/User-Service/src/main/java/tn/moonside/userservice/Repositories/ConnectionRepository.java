package tn.moonside.userservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import tn.moonside.userservice.entities.Connection;
import tn.moonside.userservice.entities.ConnectionStatus;

import java.util.List;
import java.util.Optional;

public interface ConnectionRepository extends MongoRepository<Connection, String> {

    Optional<Connection> findByRequesterIdAndReceiverId(String requesterId, String receiverId);

    /** Finds any connection (pending or accepted) between two users, regardless of who sent it. */
    @Query("{ '$or': [ { 'requesterId': ?0, 'receiverId': ?1 }, { 'requesterId': ?1, 'receiverId': ?0 } ] }")
    Optional<Connection> findBetween(String userIdA, String userIdB);

    List<Connection> findByReceiverIdAndStatus(String receiverId, ConnectionStatus status);

    List<Connection> findByRequesterIdAndStatus(String requesterId, ConnectionStatus status);

    /** All accepted connections involving this user, on either side. */
    @Query("{ '$or': [ { 'requesterId': ?0 }, { 'receiverId': ?0 } ], 'status': 'ACCEPTED' }")
    List<Connection> findAllAcceptedForUser(String userId);

    @Query(value = "{ '$or': [ { 'requesterId': ?0 }, { 'receiverId': ?0 } ], 'status': 'ACCEPTED' }", count = true)
    long countAcceptedForUser(String userId);
}
