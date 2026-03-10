package tn.moonside.userservice.Repositories;

import tn.moonside.userservice.Entities.Permission;
import tn.moonside.userservice.Enums.TypeScope;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRepository extends MongoRepository<Permission, String> {
    Optional<Permission> findByPermissionId(UUID permissionId);
    Optional<Permission> findByActionAndScopeType(String action, TypeScope scopeType);
    boolean existsByActionAndScopeType(String action, TypeScope scopeType);
}