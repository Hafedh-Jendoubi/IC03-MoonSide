import { apiFetch } from '../client'
import type { SearchHistoryItem, SearchResponse } from '../types/search'

export const searchApi = {
  /** Global search across users, teams, and posts. Backs the navbar search bar. */
  search: (query: string) => apiFetch<SearchResponse>(`/search?q=${encodeURIComponent(query)}`),

  /** This user's recent search terms, most recent first. */
  getHistory: () => apiFetch<SearchHistoryItem[]>('/search/history'),

  /** Remembers a search term the user just ran. */
  addHistoryEntry: (query: string) =>
    apiFetch<void>('/search/history', { method: 'POST', body: JSON.stringify({ query }) }),

  /** Removes a single remembered term. */
  deleteHistoryEntry: (id: string) => apiFetch<void>(`/search/history/${id}`, { method: 'DELETE' }),

  /** Clears this user's entire search history. */
  clearHistory: () => apiFetch<void>('/search/history', { method: 'DELETE' }),
}
