import { apiFetch, tokenStorage } from '../client'
import { Notification } from '../../types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function authHeader() {
  return { Authorization: `Bearer ${tokenStorage.getAccessToken()}` }
}

export interface NotificationPage {
  content: Notification[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const notificationsApi = {
  getNotifications: async (page = 0, size = 20): Promise<NotificationPage> => {
    const res = await fetch(`${API_BASE}/api/notifications?page=${page}&size=${size}`, {
      headers: authHeader(),
    })
    return res.json()
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
      headers: authHeader(),
    })
    return res.json()
  },

  markAsRead: (id: string): Promise<Notification> =>
    apiFetch<Notification>(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  markAllAsRead: (): Promise<void> =>
    apiFetch<void>('/api/notifications/read-all', { method: 'PATCH' }),

  deleteNotification: (id: string): Promise<void> =>
    apiFetch<void>(`/api/notifications/${id}`, { method: 'DELETE' }),
}
