// ─── Enums ────────────────────────────────────────────────────────────────────

export type TypeScope = "ALL" | "GLOBAL" | "DEPARTMENT" | "TEAM" | "OWN";

// ─── Generic API wrapper ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate?: string;       // ISO date string (YYYY-MM-DD)
  phoneNumber?: string;
  jobTitle?: string;
  bio?: string;
  avatar?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

// ─── User ──────────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  roleId: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  phoneNumber?: string;
  jobTitle?: string;
  bio?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phoneNumber?: string;
  jobTitle?: string;
  bio?: string;
  avatar?: string;
}

export interface AssignRoleRequest {
  roleId: string;
  scopeType: TypeScope;
  scopeId?: string;
}

// ─── Role ──────────────────────────────────────────────────────────────────────

export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  permissions: PermissionResponse[];
}

export interface RoleRequest {
  name: string;
  description?: string;
}

// ─── Permission ────────────────────────────────────────────────────────────────

export interface PermissionResponse {
  id: string;
  action: string;
  scopeType: TypeScope;
  description?: string;
  createdAt: string;
}

export interface PermissionRequest {
  action: string;
  scopeType: TypeScope;
  description?: string;
}