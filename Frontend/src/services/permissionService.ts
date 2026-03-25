import apiClient from "@/lib/axios";
import { handleApiError } from "@/lib/apiError";
import {
  ApiResponse,
  PermissionRequest,
  PermissionResponse,
  TypeScope,
} from "@/types/api";

const BASE = "/permissions";

const permissionService = {
  /** POST /api/v1/permissions */
  create: async (payload: PermissionRequest): Promise<PermissionResponse> => {
    try {
      const { data } = await apiClient.post<ApiResponse<PermissionResponse>>(
        BASE,
        payload
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * GET /api/v1/permissions
   * Pass scopeType to filter: GET /api/v1/permissions?scopeType=GLOBAL
   */
  getAll: async (scopeType?: TypeScope): Promise<PermissionResponse[]> => {
    try {
      const { data } = await apiClient.get<ApiResponse<PermissionResponse[]>>(
        BASE,
        { params: scopeType ? { scopeType } : undefined }
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /** GET /api/v1/permissions/:id */
  getById: async (id: string): Promise<PermissionResponse> => {
    try {
      const { data } = await apiClient.get<ApiResponse<PermissionResponse>>(
        `${BASE}/${id}`
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /** PUT /api/v1/permissions/:id */
  update: async (
    id: string,
    payload: PermissionRequest
  ): Promise<PermissionResponse> => {
    try {
      const { data } = await apiClient.put<ApiResponse<PermissionResponse>>(
        `${BASE}/${id}`,
        payload
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /** DELETE /api/v1/permissions/:id */
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`${BASE}/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default permissionService;