import { apiFetch } from '../client'
import type { SearchResponse } from '../types/search'

export const searchApi = {
  /** Global search across users, teams, and posts. Backs the navbar search bar. */
  search: (query: string) => apiFetch<SearchResponse>(`/search?q=${encodeURIComponent(query)}`),
}
