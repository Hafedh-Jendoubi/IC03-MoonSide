import { apiFetch } from '../client'
import type { PostStats, OrgStats } from '../types/stats'

export const statsApi = {
  /** Real posts / comments / reactions statistics for the admin dashboard. */
  getPostStats: () => apiFetch<PostStats>('/posts/stats'),

  /** Real departments / teams / projects statistics for the admin dashboard. */
  getOrgStats: () => apiFetch<OrgStats>('/organizations/stats'),
}
