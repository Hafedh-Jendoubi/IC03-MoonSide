import { apiFetch } from '../client'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  TwoFactorVerifyRequest,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
} from '../types/auth'

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

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiFetch<null>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }, false),

  verifyOtp: (data: VerifyOtpRequest) =>
    apiFetch<null>('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }, false),

  resetPassword: (data: ResetPasswordRequest) =>
    apiFetch<null>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }, false),

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
