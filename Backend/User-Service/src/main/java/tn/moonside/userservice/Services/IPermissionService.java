package tn.moonside.userservice.Services;

import tn.moonside.userservice.Dtos.PermissionCreateDTO;
import tn.moonside.userservice.Dtos.PermissionDTO;

import java.util.List;
import java.util.UUID;

public interface IPermissionService {
    public PermissionDTO createPermission(PermissionCreateDTO permissionCreateDTO);
    public PermissionDTO getPermissionById(UUID permissionId);
    public PermissionDTO getPermissionByActionAndScope(String action, String scopeType);
    public List<PermissionDTO> getAllPermissions();
    public PermissionDTO updatePermission(UUID permissionId, PermissionCreateDTO permissionUpdateDTO);
    public void deletePermission(UUID permissionId);
}
