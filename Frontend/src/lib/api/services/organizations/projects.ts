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

  /** CEO-only: create from the back-office (full control). */
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

  // ── Project member assignment ────────────────────────────────────────────

  assignUser: (projectId: string, userId: string) =>
    apiFetch<ProjectResponse>(`/organizations/projects/${projectId}/members/${userId}`, {
      method: 'POST',
    }),

  unassignUser: (projectId: string, userId: string) =>
    apiFetch<ProjectResponse>(`/organizations/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    }),

  // ── Team self-service ───────────────────────────────────────────────────────

  /**
   * Team Leader (or CEO / Dept Leader of that team) creates a project that is
   * automatically assigned to the given team.
   */
  createForTeam: (teamId: string, data: ProjectRequest) =>
    apiFetch<ProjectResponse>(`/organizations/teams/${teamId}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Department project creation ─────────────────────────────────────────────

  /**
   * Returns all projects whose responsible teams belong to this department.
   */
  getByDepartment: (deptId: string) =>
    apiFetch<ProjectResponse[]>(`/organizations/departments/${deptId}/projects`),

  /**
   * Department Leader (or CEO) creates a project and assigns it to a team
   * inside the given department.  The selected teamId must be in request.teamIds.
   */
  createForDepartment: (deptId: string, data: ProjectRequest) =>
    apiFetch<ProjectResponse>(`/organizations/departments/${deptId}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
