import { ApiResponse } from './types/common'
import { AuthResponse } from './types/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Token storage helpers
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

// Core fetch wrapper
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
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
