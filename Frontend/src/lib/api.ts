const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// --- Types matching backend DTOs ---------------------------------------------

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserResponse
  twoFactorRequired: boolean
  emailVerificationRequired: boolean
}

export interface UserResponse {
  id: string
  roles: string[]
  /** Flat list of all permission action strings across all the user's roles. */
  permissions: string[]
  email: string
  firstName: string
  lastName: string
  birthDate: string | null
  phoneNumber: string | null
  jobTitle: string | null
  bio: string | null
  avatar: string | null
  active: boolean
  mustChangePassword: boolean
  lastLogin: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  birthDate: string // ISO date string e.g. "1995-06-15"
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

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  birthDate?: string
  phoneNumber?: string
  jobTitle?: string
  bio?: string
  avatar?: string
}

// -- Email Verification DTOs ---------------------------------------------------

export interface VerifyEmailRequest {
  email: string
  otp: string
}

// -- Password Reset DTOs -------------------------------------------------------

export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyOtpRequest {
  email: string
  otp: string
}

export interface ResetPasswordRequest {
  email: string
  otp: string
  newPassword: string
}

// -- 2FA DTOs -----------------------------------------------------------------

export interface TwoFactorVerifyRequest {
  email: string
  code: string
}

export interface TwoFactorSetupResponse {
  secret: string
  qrCodeUri: string
  qrCodeImage: string // data:image/png;base64,...
}

export interface TwoFactorStatusResponse {
  twoFactorEnabled: boolean
}

// --- Token storage helpers ----------------------------------------------------

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  },
  clear: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },
}

// --- Core fetch wrapper -------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  // Do NOT set Content-Type for FormData — the browser must set it automatically
  // so it includes the multipart boundary. For everything else default to JSON.
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }

  if (authenticated) {
    const token = tokenStorage.getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401 && authenticated) {
    const refreshToken = tokenStorage.getRefreshToken()
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Refresh-Token': refreshToken,
          },
        })
        if (refreshRes.ok) {
          const refreshData: ApiResponse<AuthResponse> = await refreshRes.json()
          tokenStorage.setTokens(refreshData.data.accessToken, refreshData.data.refreshToken)
          headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`
          const retryRes = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
          if (!retryRes.ok) {
            const err = await retryRes.json().catch(() => ({}))
            throw new Error(err.message || `Request failed: ${retryRes.status}`)
          }
          const retryData: ApiResponse<T> = await retryRes.json()
          return retryData.data
        }
      } catch {
        tokenStorage.clear()
        window.location.href = '/login'
      }
    }
    tokenStorage.clear()
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Request failed: ${res.status}`)
  }

  const body: ApiResponse<T> = await res.json()
  return body.data
}

// --- Auth endpoints -----------------------------------------------------------

export const authApi = {
  login: (data: LoginRequest) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }, false),

  register: (data: RegisterRequest) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }, false),

  verifyEmail: (data: VerifyEmailRequest) =>
    apiFetch<null>('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }, false),

  resendVerification: (email: string) =>
    apiFetch<null>(
      `/auth/resend-verification?email=${encodeURIComponent(email)}`,
      { method: 'POST' },
      false
    ),

  refreshToken: (refreshToken: string) =>
    apiFetch<AuthResponse>(
      '/auth/refresh',
      { method: 'POST', headers: { 'X-Refresh-Token': refreshToken } },
      false
    ),

  // -- Password Reset ----------------------------------------------------------

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiFetch<null>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }, false),

  verifyOtp: (data: VerifyOtpRequest) =>
    apiFetch<null>('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }, false),

  resetPassword: (data: ResetPasswordRequest) =>
    apiFetch<null>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }, false),

  // -- 2FA ---------------------------------------------------------------------

  verify2FALogin: (data: TwoFactorVerifyRequest) =>
    apiFetch<AuthResponse>(
      '/auth/2fa/verify-login',
      { method: 'POST', body: JSON.stringify(data) },
      false
    ),

  setup2FA: () => apiFetch<TwoFactorSetupResponse>('/auth/2fa/setup', { method: 'POST' }),

  enable2FA: (code: string) =>
    apiFetch<null>(`/auth/2fa/enable?code=${encodeURIComponent(code)}`, { method: 'POST' }),

  disable2FA: (code: string) =>
    apiFetch<null>(`/auth/2fa/disable?code=${encodeURIComponent(code)}`, { method: 'POST' }),

  get2FAStatus: () => apiFetch<TwoFactorStatusResponse>('/auth/2fa/status'),
}

// --- User endpoints -----------------------------------------------------------

export const userApi = {
  getAll: () => apiFetch<UserResponse[]>('/users'),
  getById: (id: string) => apiFetch<UserResponse>(`/users/${id}`),
  getMe: () => apiFetch<UserResponse>('/users/me'),
  updateMe: (data: UpdateUserRequest) =>
    apiFetch<UserResponse>('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateUserRequest) =>
    apiFetch<UserResponse>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateAvatar: (avatarUrl: string) =>
    apiFetch<UserResponse>('/users/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    }),
  deleteAvatar: () =>
    apiFetch<UserResponse>('/users/me/avatar', {
      method: 'DELETE',
    }),
  delete: (id: string) => apiFetch<void>(`/users/${id}`, { method: 'DELETE' }),
  bulkInvite: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiFetch<BulkInviteResult>('/users/invite/bulk', { method: 'POST', body: form })
  },
  invite: (data: InviteUserRequest) =>
    apiFetch<UserResponse>('/users/invite', { method: 'POST', body: JSON.stringify(data) }),
  deactivate: (id: string) => apiFetch<void>(`/users/${id}/deactivate`, { method: 'PATCH' }),
  activate: (id: string) => apiFetch<void>(`/users/${id}/activate`, { method: 'PATCH' }),
  assignRole: (userId: string, data: { roleId: string; scopeType?: string; scopeId?: string }) =>
    apiFetch<void>(`/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ scopeType: 'GLOBAL', scopeId: 'GLOBAL', ...data }),
    }),
  revokeRole: (userId: string, roleId: string) =>
    apiFetch<void>(`/users/${userId}/roles/${roleId}`, { method: 'DELETE' }),
}

// --- Role & Permission types ---------------------------------------------------

export interface PermissionResponse {
  id: string
  action: string
  scopeType: 'ALL' | 'GLOBAL' | 'DEPARTMENT' | 'TEAM' | 'OWN'
  description: string | null
  createdAt: string
}

export interface RoleResponse {
  id: string
  name: string
  description: string | null
  createdAt: string
  permissions: PermissionResponse[]
}

export interface RoleRequest {
  name: string
  description?: string
}

export interface PermissionRequest {
  action: string
  scopeType: 'ALL' | 'GLOBAL' | 'DEPARTMENT' | 'TEAM' | 'OWN'
  description?: string
}

// --- Role endpoints ------------------------------------------------------------

export const roleApi = {
  getAll: () => apiFetch<RoleResponse[]>('/roles'),
  getById: (id: string) => apiFetch<RoleResponse>(`/roles/${id}`),
  create: (data: RoleRequest) =>
    apiFetch<RoleResponse>('/roles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: RoleRequest) =>
    apiFetch<RoleResponse>(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/roles/${id}`, { method: 'DELETE' }),
  assignPermission: (roleId: string, permissionId: string) =>
    apiFetch<void>(`/roles/${roleId}/permissions/${permissionId}`, { method: 'POST' }),
  revokePermission: (roleId: string, permissionId: string) =>
    apiFetch<void>(`/roles/${roleId}/permissions/${permissionId}`, { method: 'DELETE' }),
}

// --- Media types & endpoints ---------------------------------------------------

export interface MediaResponse {
  id: string
  uploadedBy: string
  originalFilename: string
  contentType: string
  size: number
  url: string
  context: string
  uploadedAt: string
}

/**
 * Upload a file to the Media-Service.
 * Uses a raw fetch (not apiFetch) so we can send multipart/form-data
 * without the Content-Type: application/json header override.
 */
async function uploadFile(path: string, formData: FormData): Promise<MediaResponse> {
  const token = tokenStorage.getAccessToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Upload failed: ${res.status}`)
  }

  const body: ApiResponse<MediaResponse> = await res.json()
  return body.data
}

export const mediaApi = {
  /**
   * Upload any file. Returns the stored metadata including the public URL.
   * @param file     The File object from an <input type="file">
   * @param context  Logical context tag: AVATAR | POST_ATTACHMENT | GENERAL
   */
  upload: (file: File, context: string = 'GENERAL'): Promise<MediaResponse> => {
    const form = new FormData()
    form.append('file', file)
    form.append('context', context)
    return uploadFile('/media/upload', form)
  },

  getById: (id: string) => apiFetch<MediaResponse>(`/media/${id}`),
}

// --- Permission endpoints ------------------------------------------------------

export const permissionApi = {
  getAll: () => apiFetch<PermissionResponse[]>('/permissions'),
  getById: (id: string) => apiFetch<PermissionResponse>(`/permissions/${id}`),
  create: (data: PermissionRequest) =>
    apiFetch<PermissionResponse>('/permissions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: PermissionRequest) =>
    apiFetch<PermissionResponse>(`/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiFetch<void>(`/permissions/${id}`, { method: 'DELETE' }),
}

// --- Audit Log types & endpoints ----------------------------------------------

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
  number: number // current page (0-based)
  size: number
}

export interface AuditLogStats {
  total: number
  success: number
  failure: number
}

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

// -----------------------------------------------------------------------------
// ORGANIZATION SERVICE  –  Types & API
// Append this block to src/lib/api.ts
// -----------------------------------------------------------------------------

export type VisibilityType = 'PUBLIC' | 'PRIVATE'

export interface UserSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string | null
  jobTitle: string | null
}

// -- Department ----------------------------------------------------------------

export interface DepartmentResponse {
  id: string
  managerId: string | null
  manager: UserSummary | null
  name: string
  description: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  isActive: boolean
  teamCount: number
  isFollowing: boolean
  followerCount: number
  createdAt: string
  updatedAt: string
}

export interface DepartmentRequest {
  name: string
  description?: string
  managerId?: string
  avatarUrl?: string
  bannerUrl?: string
}

// -- Team ----------------------------------------------------------------------

export interface TeamResponse {
  id: string
  departmentId: string
  departmentName: string | null
  leadId: string | null
  lead: UserSummary | null
  name: string
  description: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  teamVisibility: VisibilityType
  memberCount: number
  isMember: boolean
  isFollowing: boolean
  followerCount: number
  createdAt: string
  updatedAt: string
}

export interface TeamRequest {
  name: string
  description?: string
  departmentId: string
  leadId?: string
  avatarUrl?: string
  bannerUrl?: string
  teamVisibility: VisibilityType
}

export interface UserTeamResponse {
  id: string
  userId: string
  teamId: string
  user: UserSummary | null
  joinedAt: string
}

// -- Department API ------------------------------------------------------------

export const departmentApi = {
  getAll: () => apiFetch<DepartmentResponse[]>('/organizations/departments'),

  getActive: () => apiFetch<DepartmentResponse[]>('/organizations/departments/active'),

  getById: (id: string) => apiFetch<DepartmentResponse>(`/organizations/departments/${id}`),

  create: (data: DepartmentRequest) =>
    apiFetch<DepartmentResponse>('/organizations/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: DepartmentRequest) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch<void>(`/organizations/departments/${id}`, { method: 'DELETE' }),

  activate: (id: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/activate`, {
      method: 'PATCH',
    }),

  deactivate: (id: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/deactivate`, {
      method: 'PATCH',
    }),

  assignManager: (id: string, managerId: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/manager`, {
      method: 'PATCH',
      body: JSON.stringify({ managerId }),
    }),

  removeManager: (id: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/manager`, {
      method: 'DELETE',
    }),

  updateAvatar: (id: string, url: string | null) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ url }),
    }),

  updateBanner: (id: string, url: string | null) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/banner`, {
      method: 'PATCH',
      body: JSON.stringify({ url }),
    }),

  follow: (id: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/follow`, { method: 'POST' }),

  unfollow: (id: string) =>
    apiFetch<DepartmentResponse>(`/organizations/departments/${id}/follow`, { method: 'DELETE' }),
}

// -- Team API ------------------------------------------------------------------

export const teamApi = {
  getAll: () => apiFetch<TeamResponse[]>('/organizations/teams'),

  getPublic: () => apiFetch<TeamResponse[]>('/organizations/teams/public'),

  /** Returns PUBLIC teams + PRIVATE teams the current user is allowed to see */
  getVisible: () => apiFetch<TeamResponse[]>('/organizations/teams/visible'),

  search: (q: string) =>
    apiFetch<TeamResponse[]>(`/organizations/teams/search?q=${encodeURIComponent(q)}`),

  getMy: () => apiFetch<TeamResponse[]>('/organizations/teams/my'),

  getByDepartment: (departmentId: string) =>
    apiFetch<TeamResponse[]>(`/organizations/teams/department/${departmentId}`),

  getById: (id: string) => apiFetch<TeamResponse>(`/organizations/teams/${id}`),

  getMembers: (id: string) => apiFetch<UserTeamResponse[]>(`/organizations/teams/${id}/members`),

  create: (data: TeamRequest) =>
    apiFetch<TeamResponse>('/organizations/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: TeamRequest) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch<void>(`/organizations/teams/${id}`, { method: 'DELETE' }),

  assignLead: (id: string, leadId: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/lead`, {
      method: 'PATCH',
      body: JSON.stringify({ leadId }),
    }),

  removeLead: (id: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/lead`, { method: 'DELETE' }),

  join: (id: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/join`, { method: 'POST' }),

  leave: (id: string) => apiFetch<void>(`/organizations/teams/${id}/leave`, { method: 'DELETE' }),

  addMember: (teamId: string, userId: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${teamId}/members/${userId}`, {
      method: 'POST',
    }),

  assignMember: (teamId: string, userId: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${teamId}/assign/${userId}`, {
      method: 'POST',
    }),

  removeMember: (teamId: string, userId: string) =>
    apiFetch<void>(`/organizations/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    }),

  updateAvatar: (id: string, url: string | null) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ url }),
    }),

  updateBanner: (id: string, url: string | null) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/banner`, {
      method: 'PATCH',
      body: JSON.stringify({ url }),
    }),

  follow: (id: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/follow`, { method: 'POST' }),

  unfollow: (id: string) =>
    apiFetch<TeamResponse>(`/organizations/teams/${id}/follow`, { method: 'DELETE' }),
}
