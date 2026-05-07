export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  birthDate?: string
  phoneNumber?: string
  jobTitle?: string
  bio?: string
  avatar?: string
}

export interface InviteUserRequest {
  email: string
}

export interface BulkInviteRowResult {
  rowNumber: number
  email: string
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED'
  message: string
}

export interface BulkInviteResult {
  total: number
  succeeded: number
  skipped: number
  failed: number
  rows: BulkInviteRowResult[]
}
