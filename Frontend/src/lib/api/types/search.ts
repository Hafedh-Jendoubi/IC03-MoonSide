export interface UserHit {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle?: string
  avatar?: string
}

export interface TeamHit {
  id: string
  name: string
  description?: string
  departmentId?: string
  avatarUrl?: string
}

export interface DepartmentHit {
  id: string
  name: string
  description?: string
  avatarUrl?: string
}

export interface PostHit {
  id: string
  content: string
  authorId: string
  authorName?: string
  postType?: string
  createdAt?: string
}

export interface SearchResult {
  users: UserHit[]
  teams: TeamHit[]
  departments: DepartmentHit[]
  posts: PostHit[]
  totalHits: number
}
