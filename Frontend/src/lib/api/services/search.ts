import { apiFetch } from '../client'
import type { SearchHistoryItem, SearchResponse } from '../types/search'

export const searchApi = {
  /** Global search across users, teams, departments, and posts. Backs the navbar search bar. */
  search: (query: string) => apiFetch<SearchResponse>(`/search?q=${encodeURIComponent(query)}`),

  /** This user's recent searches, most recent first. */
  getHistory: () => apiFetch<SearchHistoryItem[]>('/search/history'),

  /** Remembers a search term for this user. */
  recordSearch: (query: string) =>
    apiFetch<void>('/search/history', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  /** Removes a single recent-search entry. */
  deleteHistoryEntry: (id: string) => apiFetch<void>(`/search/history/${id}`, { method: 'DELETE' }),

  /** Wipes this user's entire search history. */
  clearHistory: () => apiFetch<void>('/search/history', { method: 'DELETE' }),
}
