export interface UserSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string | null
  jobTitle: string | null
}

export interface DepartmentResponse {
  id: string
  managerId: string | null
  manager: UserSummary | null
  name: string
  description: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  isActive: boolean
  membersPublic: boolean
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
  membersPublic?: boolean
}

export type VisibilityType = 'PUBLIC' | 'PRIVATE'

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
