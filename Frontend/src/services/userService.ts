import apiClient from "@/lib/axios";
import { handleApiError } from "@/lib/apiError";
import {
  ApiResponse,
  AssignRoleRequest,
  UpdateUserRequest,
  UserResponse,
} from "@/types/api";

const BASE = "/api/v1/users";

const userService = {
  /**
   * GET /api/v1/users
   * Returns all users. Requires authentication.
   */
  getAll: async (): Promise<UserResponse[]> => {
    try {
      const { data } = await apiClient.get<ApiResponse<UserResponse[]>>(BASE);
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * GET /api/v1/users/:id
   */
  getById: async (id: string): Promise<UserResponse> => {
    try {
      const { data } = await apiClient.get<ApiResponse<UserResponse>>(
        `${BASE}/${id}`
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * GET /api/v1/users/me
   * Returns the currently authenticated user (resolved from JWT).
   */
  getMe: async (): Promise<UserResponse> => {
    try {
      const { data } = await apiClient.get<ApiResponse<UserResponse>>(
        `${BASE}/me`
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * PUT /api/v1/users/:id
   * Partial update — only supplied fields are changed.
   */
  update: async (
    id: string,
    payload: UpdateUserRequest
  ): Promise<UserResponse> => {
    try {
      const { data } = await apiClient.put<ApiResponse<UserResponse>>(
        `${BASE}/${id}`,
        payload
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * DELETE /api/v1/users/:id
   */
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`${BASE}/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * POST /api/v1/users/:userId/roles
   * Assigns a role (with scope) to a user.
   */
  assignRole: async (
    userId: string,
    payload: AssignRoleRequest
  ): Promise<void> => {
    try {
      await apiClient.post(`${BASE}/${userId}/roles`, payload);
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * DELETE /api/v1/users/:userId/roles/:roleId
   * Revokes a role from a user.
   */
  revokeRole: async (userId: string, roleId: string): Promise<void> => {
    try {
      await apiClient.delete(`${BASE}/${userId}/roles/${roleId}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * PATCH /api/v1/users/:id/deactivate
   */
  deactivate: async (id: string): Promise<void> => {
    try {
      await apiClient.patch(`${BASE}/${id}/deactivate`);
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * PATCH /api/v1/users/:id/activate
   */
  activate: async (id: string): Promise<void> => {
    try {
      await apiClient.patch(`${BASE}/${id}/activate`);
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default userService;