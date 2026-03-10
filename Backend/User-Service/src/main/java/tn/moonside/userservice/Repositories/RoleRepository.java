package tn.moonside.userservice.Repositories;

import tn.moonside.userservice.Entities.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends MongoRepository<Role, String> {
    Optional<Role> findByRoleId(UUID roleId);
    Optional<Role> findByName(String name);
    boolean existsByName(String name);
    boolean existsByRoleId(UUID roleId);
}