import { apiFetch } from '../../client'
import type { TeamResponse, TeamRequest, UserTeamResponse } from '../../types/organizations'

export const teamApi = {
  getAll: () => apiFetch<TeamResponse[]>('/organizations/teams'),

  getPublic: () => apiFetch<TeamResponse[]>('/organizations/teams/public'),

  /** Returns PUBLIC teams + PRIVATE teams the current user is allowed to see */
  getVisible: () => apiFetch<TeamResponse[]>('/organizations/teams/visible'),

  search: (q: string) =>
    apiFetch<TeamResponse[]>(`/organizations/teams/search?q=${encodeURIComponent(q)}`),

  getMy: () => apiFetch<TeamResponse[]>('/organizations/teams/my'),

  getByDepartment: (departmentId: string) =>
    apiFetch<TeamResponse[]>(`/organizations/teams/department/${departmentId}`),

  getById: (id: string) => apiFetch<TeamResponse>(`/organizations/teams/${id}`),

  getMembers: (id: string) => apiFetch<UserTeamResponse[]>(`/organizations/teams/${id}/members`),

  create: (data: TeamRequest) =>
    apiFetch<TeamResponse>('/organizations/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: TeamRequest) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch<void>(`/organizations/teams/${id}`, { method: 'DELETE' }),

  assignLead: (id: string, leadId: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/lead`, {
      method: 'PATCH',
      body: JSON.stringify({ leadId }),
    }),

  removeLead: (id: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/lead`, { method: 'DELETE' }),

  join: (id: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/join`, { method: 'POST' }),

  leave: (id: string) => apiFetch<void>(`/organizations/teams/${id}/leave`, { method: 'DELETE' }),

  addMember: (teamId: string, userId: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${teamId}/members/${userId}`, {
      method: 'POST',
    }),

  assignMember: (teamId: string, userId: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${teamId}/assign/${userId}`, {
      method: 'POST',
    }),

  removeMember: (teamId: string, userId: string) =>
    apiFetch<void>(`/organizations/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    }),

  updateAvatar: (id: string, url: string | null) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ url }),
    }),

  updateBanner: (id: string, url: string | null) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/banner`, {
      method: 'PATCH',
      body: JSON.stringify({ url }),
    }),

  follow: (id: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/follow`, { method: 'POST' }),

  unfollow: (id: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/follow`, { method: 'DELETE' }),
}
