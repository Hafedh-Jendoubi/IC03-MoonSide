export type SearchResultType = 'USER' | 'TEAM' | 'DEPARTMENT' | 'POST'

export interface SearchResultItem {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  /** Only set for POST results — the team the post belongs to. */
  teamId?: string | null
}

export interface SearchResponse {
  users: SearchResultItem[]
  teams: SearchResultItem[]
  departments: SearchResultItem[]
  posts: SearchResultItem[]
}

export interface SearchHistoryItem {
  id: string
  query: string
  searchedAt: string
}
