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

export interface AuditLogStats {
  total: number
  success: number
  failure: number
}
