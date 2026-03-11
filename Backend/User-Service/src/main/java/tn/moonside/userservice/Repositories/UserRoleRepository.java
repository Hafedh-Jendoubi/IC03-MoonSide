package tn.moonside.userservice.repositories;

import tn.moonside.userservice.entities.TypeScope;
import tn.moonside.userservice.entities.UserRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends MongoRepository<UserRole, String> {
    List<UserRole> findByUserId(String userId);
    List<UserRole> findByRoleId(String roleId);
    List<UserRole> findByUserIdAndScopeType(String userId, TypeScope scopeType);
    Optional<UserRole> findByUserIdAndRoleIdAndScopeTypeAndScopeId(
            String userId, String roleId, TypeScope scopeType, String scopeId);
    void deleteByUserIdAndRoleId(String userId, String roleId);
    boolean existsByUserIdAndRoleIdAndScopeTypeAndScopeId(
            String userId, String roleId, TypeScope scopeType, String scopeId);
}
