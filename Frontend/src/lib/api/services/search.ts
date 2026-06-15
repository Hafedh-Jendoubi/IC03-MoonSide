import { apiFetch } from '../client'
import type { SearchResult } from '../types/search'

export const searchApi = {
  /**
   * Global search across users, teams, departments and posts.
   * @param q     - search query string
   * @param size  - max results per category (default 5)
   */
  global: (q: string, size = 5) =>
    apiFetch<SearchResult>(`/search?q=${encodeURIComponent(q)}&size=${size}`),
}
