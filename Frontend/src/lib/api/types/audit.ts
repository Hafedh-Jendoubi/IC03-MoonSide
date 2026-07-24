export interface AuditLogResponse {
  id: string
  userId: string | null
  entityId: string | null
  entityType: string | null
  action: string
  description: string
  success: boolean
  oldValue: string | null
  newValue: string | null
  ipAddress: string | null
  createdAt: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

import type { HourlyCount, DailyCount, NamedCount } from './stats'

export interface AuditLogStats {
  total: number
  success: number
  failure: number
}

export interface ActivityStats {
  activityByHour: HourlyCount[]
  loginsPerDay: DailyCount[]
  topActions: NamedCount[]
  totalEventsLast30Days: number
  totalLoginsLast30Days: number
}
