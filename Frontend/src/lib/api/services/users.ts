import { apiFetch } from '../client'
import type { UpdateUserRequest, InviteUserRequest, BulkInviteResult } from '../types/users'
import type { UserResponse } from '../types/auth'

export const userApi = {
  getAll: () => apiFetch<UserResponse[]>('/users'),
  getById: (id: string) => apiFetch<UserResponse>(`/users/${id}`),
  getMe: () => apiFetch<UserResponse>('/users/me'),
  updateMe: (data: UpdateUserRequest) =>
    apiFetch<UserResponse>('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateUserRequest) =>
    apiFetch<UserResponse>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateAvatar: (avatarUrl: string) =>
    apiFetch<UserResponse>('/users/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    }),
  deleteAvatar: () =>
    apiFetch<UserResponse>('/users/me/avatar', {
      method: 'DELETE',
    }),
  delete: (id: string) => apiFetch<void>(`/users/${id}`, { method: 'DELETE' }),
  bulkInvite: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiFetch<BulkInviteResult>('/users/invite/bulk', { method: 'POST', body: form })
  },
  invite: (data: InviteUserRequest) =>
    apiFetch<UserResponse>('/users/invite', { method: 'POST', body: JSON.stringify(data) }),
  deactivate: (id: string) => apiFetch<void>(`/users/${id}/deactivate`, { method: 'PATCH' }),
  activate: (id: string) => apiFetch<void>(`/users/${id}/activate`, { method: 'PATCH' }),
  assignRole: (userId: string, data: { roleId: string; scopeType?: string; scopeId?: string }) =>
    apiFetch<void>(`/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ scopeType: 'GLOBAL', scopeId: 'GLOBAL', ...data }),
    }),
  revokeRole: (userId: string, roleId: string) =>
    apiFetch<void>(`/users/${userId}/roles/${roleId}`, { method: 'DELETE' }),
}
