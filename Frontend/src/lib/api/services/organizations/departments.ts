import { apiFetch } from '../../client'
import type { DepartmentResponse, DepartmentRequest, UserSummary } from '../../types/organizations'

export const departmentApi = {
  getAll: () => apiFetch<DepartmentResponse[]>('/organizations/departments'),
  getActive: () => apiFetch<DepartmentResponse[]>('/organizations/departments/active'),
  getById: (id: string) => apiFetch<DepartmentResponse>(`/organizations/departments/${id}`),
  getFollowers: (id: string) =>
    apiFetch<UserSummary[]>(`/organizations/departments/${id}/followers`),
  create: (data: DepartmentRequest) =>
    apiFetch<DepartmentResponse>('/organizations/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: DepartmentRequest) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiFetch<void>(`/organizations/departments/${id}`, { method: 'DELETE' }),
  activate: (id: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/activate`, {
      method: 'PATCH',
    }),
  deactivate: (id: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/deactivate`, {
      method: 'PATCH',
    }),
  assignManager: (id: string, managerId: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/manager`, {
      method: 'PATCH',
      body: JSON.stringify({ managerId }),
    }),
  removeManager: (id: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/manager`, {
      method: 'DELETE',
    }),
  updateAvatar: (id: string, url: string | null) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ url }),
    }),
  updateBanner: (id: string, url: string | null) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/banner`, {
      method: 'PATCH',
      body: JSON.stringify({ url }),
    }),
  follow: (id: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/follow`, { method: 'POST' }),
  unfollow: (id: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/follow`, { method: 'DELETE' }),
}
