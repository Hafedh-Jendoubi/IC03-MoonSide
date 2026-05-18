import { apiFetch } from '../../client'
import type { ProjectResponse, ProjectRequest } from '../../types/organizations'

export const projectApi = {
  getAll: () => apiFetch<ProjectResponse[]>('/organizations/projects'),

  getPublic: () => apiFetch<ProjectResponse[]>('/organizations/projects/public'),

  search: (q: string) =>
    apiFetch<ProjectResponse[]>(`/organizations/projects/search?q=${encodeURIComponent(q)}`),

  getByTeam: (teamId: string) =>
    apiFetch<ProjectResponse[]>(`/organizations/projects/team/${teamId}`),

  getById: (id: string) => apiFetch<ProjectResponse>(`/organizations/projects/${id}`),

  create: (data: ProjectRequest) =>
    apiFetch<ProjectResponse>('/organizations/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: ProjectRequest) =>
    apiFetch<ProjectResponse>(`/organizations/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch<void>(`/organizations/projects/${id}`, { method: 'DELETE' }),
}
