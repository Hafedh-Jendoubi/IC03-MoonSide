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

export type ProjectStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED'

export interface ProjectTeamSummary {
  id: string
  name: string
}

export interface ProjectResponse {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  avatarUrl: string | null
  bannerUrl: string | null
  repositoryUrl: string | null
  projectUrl: string | null
  technologies: string[]
  teams: ProjectTeamSummary[]
  assignedUsers: UserSummary[]
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectRequest {
  name: string
  description?: string
  status: ProjectStatus
  avatarUrl?: string
  bannerUrl?: string
  repositoryUrl?: string
  projectUrl?: string
  technologies?: string[]
  teamIds?: string[]
  startDate?: string
  endDate?: string
}
