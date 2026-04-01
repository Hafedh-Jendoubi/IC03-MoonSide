const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// ─── Types matching backend DTOs ─────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserResponse
  twoFactorRequired: boolean
}

export interface UserResponse {
  id: string
  roleId: string | null
  email: string
  firstName: string
  lastName: string
  birthDate: string | null
  phoneNumber: string | null
  jobTitle: string | null
  bio: string | null
  avatar: string | null
  isActive: boolean
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
  birthDate?: string
  phoneNumber?: string
  jobTitle?: string
  bio?: string
  avatar?: string
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

// ── Password Reset DTOs ───────────────────────────────────────────────────────

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

// ── 2FA DTOs ─────────────────────────────────────────────────────────────────

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

// ─── Token storage helpers ────────────────────────────────────────────────────

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

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }, false),

  register: (data: RegisterRequest) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }, false),

  refreshToken: (refreshToken: string) =>
    apiFetch<AuthResponse>(
      '/auth/refresh',
      { method: 'POST', headers: { 'X-Refresh-Token': refreshToken } },
      false
    ),

  // ── Password Reset ──────────────────────────────────────────────────────────

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiFetch<null>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }, false),

  verifyOtp: (data: VerifyOtpRequest) =>
    apiFetch<null>('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }, false),

  resetPassword: (data: ResetPasswordRequest) =>
    apiFetch<null>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }, false),

  // ── 2FA ─────────────────────────────────────────────────────────────────────

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

// ─── User endpoints ───────────────────────────────────────────────────────────

export const userApi = {
  getAll: () => apiFetch<UserResponse[]>('/users'),
  getById: (id: string) => apiFetch<UserResponse>(`/users/${id}`),
  getMe: () => apiFetch<UserResponse>('/users/me'),
  update: (id: string, data: UpdateUserRequest) =>
    apiFetch<UserResponse>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/users/${id}`, { method: 'DELETE' }),
  deactivate: (id: string) => apiFetch<void>(`/users/${id}/deactivate`, { method: 'PATCH' }),
  activate: (id: string) => apiFetch<void>(`/users/${id}/activate`, { method: 'PATCH' }),
  assignRole: (userId: string, data: { roleId: string }) =>
    apiFetch<void>(`/users/${userId}/roles`, { method: 'POST', body: JSON.stringify(data) }),
  revokeRole: (userId: string, roleId: string) =>
    apiFetch<void>(`/users/${userId}/roles/${roleId}`, { method: 'DELETE' }),
}

// ─── Role & Permission types ───────────────────────────────────────────────────

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

// ─── Role endpoints ────────────────────────────────────────────────────────────

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

// ─── Permission endpoints ──────────────────────────────────────────────────────

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
