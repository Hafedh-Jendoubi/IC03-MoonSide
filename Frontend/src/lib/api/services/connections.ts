import { apiFetch } from '../client'
import type {
  ConnectionResponse,
  ConnectionStatusResponse,
  UserSummaryResponse,
} from '../types/connections'

export const connectionApi = {
  /** Send a connection request to {userId}. */
  sendRequest: (userId: string) =>
    apiFetch<ConnectionResponse>(`/connections/request/${userId}`, { method: 'POST' }),

  /** Accept a pending request you received. */
  accept: (connectionId: string) =>
    apiFetch<ConnectionResponse>(`/connections/${connectionId}/accept`, { method: 'POST' }),

  /** Decline a pending request you received. */
  decline: (connectionId: string) =>
    apiFetch<void>(`/connections/${connectionId}/decline`, { method: 'POST' }),

  /** Cancel a request you sent, or remove an existing connection. */
  remove: (connectionId: string) =>
    apiFetch<void>(`/connections/${connectionId}`, { method: 'DELETE' }),

  /** All of your accepted connections. */
  getMyConnections: () => apiFetch<UserSummaryResponse[]>('/connections/me'),

  /** All accepted connections for any user — used by the connections modal on a profile page. */
  getUserConnections: (userId: string) =>
    apiFetch<UserSummaryResponse[]>(`/connections/user/${userId}`),

  /** Requests you've received, awaiting your decision. */
  getPendingReceived: () => apiFetch<ConnectionResponse[]>('/connections/me/pending'),

  /** Requests you've sent, awaiting the other person's decision. */
  getPendingSent: () => apiFetch<ConnectionResponse[]>('/connections/me/sent'),

  /** Connection count for any user's profile. */
  getCount: (userId: string) => apiFetch<{ count: number }>(`/connections/count/${userId}`),

  /** Relationship between you and {userId} — drives the Connect button state. */
  getStatus: (userId: string) =>
    apiFetch<ConnectionStatusResponse>(`/connections/status/${userId}`),
}
