package tn.moonside.userservice.repositories;

import tn.moonside.userservice.entities.UserRole;

import java.util.List;

public interface UserRoleRepositoryCustom {
    List<UserRole> findByUserIdFlexible(String userId);
    void deleteByUserIdAndRoleIdFlexible(String userId, String roleId);
    boolean existsByUserIdAndRoleIdFlexible(String userId, String roleId);
}
