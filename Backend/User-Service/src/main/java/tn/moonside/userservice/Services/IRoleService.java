package tn.moonside.userservice.Services;

import tn.moonside.userservice.Dtos.RoleCreateDTO;
import tn.moonside.userservice.Dtos.RoleDTO;

import java.util.List;
import java.util.UUID;

public interface IRoleService {
    public RoleDTO createRole(RoleCreateDTO roleCreateDTO);
    public RoleDTO getRoleById(UUID roleId);
    public RoleDTO getRoleByName(String name);
    public List<RoleDTO> getAllRoles();
    public RoleDTO updateRole(UUID roleId, RoleCreateDTO roleUpdateDTO);
    public void deleteRole(UUID roleId);
    public RoleDTO assignPermissionToRole(UUID roleId, UUID permissionId);
    public RoleDTO removePermissionFromRole(UUID roleId, UUID permissionId);

}
