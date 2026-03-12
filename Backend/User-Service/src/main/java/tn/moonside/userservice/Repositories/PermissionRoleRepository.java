package tn.moonside.userservice.repositories;

import tn.moonside.userservice.entities.PermissionRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRoleRepository extends MongoRepository<PermissionRole, String> {
    List<PermissionRole> findByRoleId(String roleId);
    List<PermissionRole> findByPermissionId(String permissionId);
    Optional<PermissionRole> findByRoleIdAndPermissionId(String roleId, String permissionId);
    void deleteByRoleIdAndPermissionId(String roleId, String permissionId);
    void deleteByRoleId(String roleId);
    boolean existsByRoleIdAndPermissionId(String roleId, String permissionId);
}