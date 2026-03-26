import apiClient from "@/lib/axios";
import { handleApiError } from "@/lib/apiError";
import { ApiResponse, RoleRequest, RoleResponse } from "@/types/api";

const BASE = "/roles";

const roleService = {
  /** POST /api/v1/roles */
  create: async (payload: RoleRequest): Promise<RoleResponse> => {
    try {
      const { data } = await apiClient.post<ApiResponse<RoleResponse>>(
        BASE,
        payload
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /** GET /api/v1/roles */
  getAll: async (): Promise<RoleResponse[]> => {
    try {
      const { data } = await apiClient.get<ApiResponse<RoleResponse[]>>(BASE);
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /** GET /api/v1/roles/:id */
  getById: async (id: string): Promise<RoleResponse> => {
    try {
      const { data } = await apiClient.get<ApiResponse<RoleResponse>>(
        `${BASE}/${id}`
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /** PUT /api/v1/roles/:id */
  update: async (id: string, payload: RoleRequest): Promise<RoleResponse> => {
    try {
      const { data } = await apiClient.put<ApiResponse<RoleResponse>>(
        `${BASE}/${id}`,
        payload
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /** DELETE /api/v1/roles/:id */
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`${BASE}/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * POST /api/v1/roles/:roleId/permissions/:permissionId
   * Assigns a permission to a role.
   */
  assignPermission: async (
    roleId: string,
    permissionId: string
  ): Promise<void> => {
    try {
      await apiClient.post(`${BASE}/${roleId}/permissions/${permissionId}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * DELETE /api/v1/roles/:roleId/permissions/:permissionId
   * Revokes a permission from a role.
   */
  revokePermission: async (
    roleId: string,
    permissionId: string
  ): Promise<void> => {
    try {
      await apiClient.delete(`${BASE}/${roleId}/permissions/${permissionId}`);
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default roleService;