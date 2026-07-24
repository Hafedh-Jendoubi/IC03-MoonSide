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
