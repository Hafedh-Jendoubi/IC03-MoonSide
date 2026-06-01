import { apiFetch } from '../client'
import type { PageResponse, AuditLogResponse, AuditLogStats } from '../types/audit'

export const auditApi = {
  getLogs: (params?: {
    page?: number
    size?: number
    userId?: string
    action?: string
    success?: boolean
  }) => {
    const query = new URLSearchParams()
    if (params?.page != null) query.set('page', String(params.page))
    if (params?.size != null) query.set('size', String(params.size))
    if (params?.userId) query.set('userId', params.userId)
    if (params?.action) query.set('action', params.action)
    if (params?.success != null) query.set('success', String(params.success))
    return apiFetch<PageResponse<AuditLogResponse>>(`/audit-logs?${query.toString()}`)
  },

  getStats: () => apiFetch<AuditLogStats>('/audit-logs/stats'),
}
