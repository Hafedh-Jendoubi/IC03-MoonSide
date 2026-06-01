import { apiFetch } from '../client'
import type {
  RoleResponse,
  RoleRequest,
  PermissionResponse,
  PermissionRequest,
} from '../types/roles'

export const roleApi = {
  getAll: () => apiFetch<RoleResponse[]>('/roles'),
  getById: (id: string) => apiFetch<RoleResponse>(`/roles/${id}`),
  create: (data: RoleRequest) =>
    apiFetch<RoleResponse>('/roles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: RoleRequest) =>
    apiFetch<RoleResponse>(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/roles/${id}`, { method: 'DELETE' }),
  assignPermission: (roleId: string, permissionId: string) =>
    apiFetch<void>(`/roles/${roleId}/permissions/${permissionId}`, { method: 'POST' }),
  revokePermission: (roleId: string, permissionId: string) =>
    apiFetch<void>(`/roles/${roleId}/permissions/${permissionId}`, { method: 'DELETE' }),
}

export const permissionApi = {
  getAll: () => apiFetch<PermissionResponse[]>('/permissions'),
  getById: (id: string) => apiFetch<PermissionResponse>(`/permissions/${id}`),
  create: (data: PermissionRequest) =>
    apiFetch<PermissionResponse>('/permissions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: PermissionRequest) =>
    apiFetch<PermissionResponse>(`/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiFetch<void>(`/permissions/${id}`, { method: 'DELETE' }),
}
