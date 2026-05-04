package tn.moonside.organizationservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.organizationservice.entities.UserTeam;

import java.util.List;
import java.util.Optional;

public interface UserTeamRepository extends MongoRepository<UserTeam, String> {

    List<UserTeam> findByTeamId(String teamId);

    List<UserTeam> findByUserId(String userId);

    Optional<UserTeam> findByUserIdAndTeamId(String userId, String teamId);

    boolean existsByUserIdAndTeamId(String userId, String teamId);

    void deleteByUserIdAndTeamId(String userId, String teamId);

    long countByTeamId(String teamId);
}
