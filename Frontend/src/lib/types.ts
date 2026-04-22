// ─── Role name constants (match backend Role.name values exactly) ─────────────
export const ROLE = {
  EMPLOYEE: 'EMPLOYEE',
  TEAM_LEADER: 'TEAM_LEADER',
  DEPARTMENT_LEADER: 'DEPARTMENT_LEADER',
  HUMAN_RESOURCES: 'HUMAN_RESOURCES',
  CEO: 'CEO',
} as const

// ─── Permission name constants (match backend AppPermission values exactly) ───
export const PERM = {
  ANYTHING: 'ANYTHING',
  USER_READ_OWN: 'USER_READ_OWN',
  USER_UPDATE_OWN: 'USER_UPDATE_OWN',
  USER_UPDATE_OWN_AVATAR: 'USER_UPDATE_OWN_AVATAR',
  USER_DELETE_OWN_AVATAR: 'USER_DELETE_OWN_AVATAR',
  USER_READ: 'USER_READ',
  USER_READ_ROLES: 'USER_READ_ROLES',
  TEAM_MANAGE: 'TEAM_MANAGE',
  TEAM_MANAGE_MEMBERS: 'TEAM_MANAGE_MEMBERS',
  TEAM_MANAGE_LEAD: 'TEAM_MANAGE_LEAD',
  DEPT_MANAGE: 'DEPT_MANAGE',
  DEPT_MANAGE_TEAMS: 'DEPT_MANAGE_TEAMS',
  DEPT_MANAGE_MANAGER: 'DEPT_MANAGE_MANAGER',
  BACKOFFICE_DASHBOARD_READ: 'BACKOFFICE_DASHBOARD_READ',
  USER_READ_ALL: 'USER_READ_ALL',
  USER_INVITE: 'USER_INVITE',
  ORG_READ: 'ORG_READ',
  USER_INVITE_BULK: 'USER_INVITE_BULK',
  BACKOFFICE_FULL: 'BACKOFFICE_FULL',
} as const

// Matches the backend UserResponse DTO from User-Service
export interface User {
  id: string
  /**
   * Role names from the UserRole join table.
   * e.g. ["EMPLOYEE", "TEAM_LEADER"]
   */
  roles: string[]
  /**
   * Flat list of permission action strings derived from all the user's roles.
   * Populated when the backend UserResponse includes a `permissions` field,
   * or computed client-side via the auth context.
   */
  permissions?: string[]
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

// Computed helper — use wherever a display name is needed
export function getFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim()
}

/** Returns true when the user holds the given role name (case-insensitive). */
export function hasRole(user: User | null | undefined, role: string): boolean {
  if (!user) return false
  return user.roles.some((r) => r.toLowerCase() === role.toLowerCase())
}

/**
 * Returns true when the user holds the given permission.
 * CEO users with ANYTHING automatically pass every check.
 */
export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false
  const perms = user.permissions ?? []
  if (perms.includes(PERM.ANYTHING)) return true
  return perms.includes(permission)
}

/**
 * Returns true when the user holds AT LEAST ONE of the given permissions.
 * CEO (ANYTHING) automatically passes.
 */
export function hasAnyPermission(user: User | null | undefined, ...permissions: string[]): boolean {
  if (!user) return false
  const perms = user.permissions ?? []
  if (perms.includes(PERM.ANYTHING)) return true
  return permissions.some((p) => perms.includes(p))
}

/**
 * Returns true when the user can access the back-office area.
 * Granted to HUMAN_RESOURCES (limited) and CEO (full).
 */
export function canAccessBackOffice(user: User | null | undefined): boolean {
  if (!user) return false
  return hasRole(user, ROLE.CEO) || hasRole(user, ROLE.HUMAN_RESOURCES)
}

/**
 * Returns true when the user has full back-office access (all sidebar items).
 * CEO only.
 */
export function hasFullBackOfficeAccess(user: User | null | undefined): boolean {
  return hasRole(user, ROLE.CEO)
}

/** @deprecated Use hasRole(user, ROLE.CEO) — kept for backward compatibility */
export function isAdmin(user: User | null | undefined): boolean {
  return hasRole(user, ROLE.CEO)
}

// Post types — kept for future post service integration
export interface Post {
  id: string
  authorId: string
  content: string
  timestamp: Date
  likes: string[]
  comments: Comment[]
}

export interface Comment {
  id: string
  authorId: string
  content: string
  timestamp: Date
  likes: string[]
}

export interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'mention'
  message: string
  read: boolean
  timestamp: Date
}

export interface Message {
  id: string
  senderId: string
  recipientId: string
  content: string
  timestamp: Date
  read: boolean
}
