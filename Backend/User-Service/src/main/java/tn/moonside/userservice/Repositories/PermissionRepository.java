package tn.moonside.userservice.repositories;

import tn.moonside.userservice.entities.Permission;
import tn.moonside.userservice.entities.TypeScope;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends MongoRepository<Permission, String> {

    Optional<Permission> findByActionAndScopeType(String action, TypeScope scopeType);

    boolean existsByActionAndScopeType(String action, TypeScope scopeType);

    /** Returns true if any permission with the given action name exists (regardless of scope). */
    boolean existsByAction(String action);

    /** Returns all permissions with the given action name. */
    List<Permission> findByAction(String action);

    List<Permission> findByScopeType(TypeScope scopeType);
}
