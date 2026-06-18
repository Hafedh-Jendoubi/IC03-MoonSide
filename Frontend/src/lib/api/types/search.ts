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

/** A single remembered search term, shown in the navbar's "Recent searches" list. */
export interface SearchHistoryItem {
  id: string
  query: string
  /** ISO-8601 timestamp of when this term was last searched. */
  searchedAt: string
}
