export type SearchResultType = 'USER' | 'TEAM' | 'POST'

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
  posts: SearchResultItem[]
}
