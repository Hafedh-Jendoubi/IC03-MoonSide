// Re-export common types
export type { ApiResponse, PageResponse } from './types/common'

// Re-export all domain types
export * from './types/auth'
export * from './types/users'
export * from './types/roles'
export * from './types/media'
export * from './types/audit'
export * from './types/organizations'
export * from './types/posts'

// Re-export all services
export { authApi } from './services/auth'
export { userApi } from './services/users'
export { roleApi, permissionApi } from './services/roles'
export { mediaApi } from './services/media'
export { auditApi } from './services/audit'
export { departmentApi } from './services/organizations/departments'
export { teamApi } from './services/organizations/teams'
export { postApi, commentApi, reactionApi } from './services/posts'

// Re-export core utilities
export { tokenStorage, apiFetch } from './client'
