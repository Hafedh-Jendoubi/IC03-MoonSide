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
    List<Permission> findByScopeType(TypeScope scopeType);
    boolean existsByActionAndScopeType(String action, TypeScope scopeType);
}