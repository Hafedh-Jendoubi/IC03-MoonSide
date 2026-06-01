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
  birthDate: string
  phoneNumber?: string
  jobTitle?: string
  bio?: string
  avatar?: string
}

export interface VerifyEmailRequest {
  email: string
  otp: string
}

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

export interface TwoFactorVerifyRequest {
  email: string
  code: string
}

export interface TwoFactorSetupResponse {
  secret: string
  qrCodeUri: string
  qrCodeImage: string
}

export interface TwoFactorStatusResponse {
  twoFactorEnabled: boolean
}
