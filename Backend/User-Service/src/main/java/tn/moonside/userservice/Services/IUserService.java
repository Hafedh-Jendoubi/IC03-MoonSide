package tn.moonside.userservice.Services;

import tn.moonside.userservice.Dtos.*;

import java.util.List;
import java.util.UUID;

public interface IUserService {
    public UserDTO createUser(UserCreateDTO userCreateDTO);
    public UserDTO getUserById(UUID userId);
    public UserDTO getUserByEmail(String email);
    public List<UserDTO> getAllUsers();
    public UserDTO updateUser(UUID userId, UserUpdateDTO userUpdateDTO);
    public void deleteUser(UUID userId);
    public UserDTO assignRoleToUser(UUID userId, UUID roleId);
    public UserDTO removeRoleFromUser(UUID userId, UUID roleId);
    public LoginResponseDTO login(LoginRequestDTO loginRequest);
}
