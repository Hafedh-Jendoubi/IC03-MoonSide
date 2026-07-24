import { apiFetch } from '../client'
import type { BadgeDefinition, UserBadge } from '../types/badges'

export const badgeApi = {
  /** All badges with holder lists — for the public /badges page */
  getAllBadges: (): Promise<BadgeDefinition[]> => apiFetch<BadgeDefinition[]>('/badges'),

  /** Full badge catalogue annotated with "earned" status for the current user */
  getMyBadges: (): Promise<BadgeDefinition[]> => apiFetch<BadgeDefinition[]>('/badges/me'),

  /** Only earned badges for the current user (with timestamps) */
  getMyEarnedBadges: (): Promise<UserBadge[]> => apiFetch<UserBadge[]>('/badges/me/earned'),

  /** Earned badges for any user — used on profile pages */
  getUserBadges: (userId: string): Promise<UserBadge[]> =>
    apiFetch<UserBadge[]>(`/badges/user/${userId}`),
}
