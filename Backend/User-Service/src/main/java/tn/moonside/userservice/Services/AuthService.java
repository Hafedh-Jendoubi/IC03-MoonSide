package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.requests.LoginRequest;
import tn.moonside.userservice.dtos.requests.RegisterRequest;
import tn.moonside.userservice.dtos.responses.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
}
