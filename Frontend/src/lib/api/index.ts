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
export { notificationsApi } from './services/notifications'
export { departmentApi } from './services/organizations/departments'
export { teamApi } from './services/organizations/teams'
export { projectApi } from './services/organizations/projects'
export {
  postApi,
  surveyApi,
  savedPostApi,
  commentApi,
  reactionApi,
  attachmentApi,
} from './services/posts'

// Re-export search
export type { SearchResult, UserHit, TeamHit, DepartmentHit, PostHit } from './types/search'
export { searchApi } from './services/search'

// Re-export core utilities
export { tokenStorage, apiFetch } from './client'
