export type ConnectionStatusValue =
  | 'NONE'
  | 'PENDING_SENT'
  | 'PENDING_RECEIVED'
  | 'CONNECTED'
  | 'SELF'

export interface UserSummaryResponse {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  jobTitle?: string
  avatar?: string | null
}

export interface ConnectionResponse {
  id: string
  requesterId: string
  receiverId: string
  status: 'PENDING' | 'ACCEPTED'
  createdAt: string
  respondedAt?: string | null
  otherUser?: UserSummaryResponse | null
}

export interface ConnectionStatusResponse {
  status: ConnectionStatusValue
  connectionId?: string | null
}
