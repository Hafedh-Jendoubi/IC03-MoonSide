import apiClient from "@/lib/axios";
import { handleApiError } from "@/lib/apiError";
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "@/types/api";

const BASE = "/api/v1/auth";

const authService = {
  /**
   * POST /api/v1/auth/register
   * Creates a new account and returns tokens + user.
   */
  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    try {
      const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
        `${BASE}/register`,
        payload
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * POST /api/v1/auth/login
   * Authenticates with email/password and returns tokens + user.
   */
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    try {
      const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
        `${BASE}/login`,
        payload
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * POST /api/v1/auth/refresh
   * Exchanges a refresh token for a new access token.
   * Header: X-Refresh-Token: <token>
   */
  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
        `${BASE}/refresh`,
        null,
        { headers: { "X-Refresh-Token": refreshToken } }
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default authService;