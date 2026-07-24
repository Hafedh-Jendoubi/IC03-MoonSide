'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { searchApi } from '@/lib/api'
import type { SearchHistoryItem, SearchResponse } from '@/lib/api/types/search'

const EMPTY_RESULTS: SearchResponse = { users: [], teams: [], departments: [], posts: [] }
const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 300

/**
 * Debounced "search as you type" hook for the navbar search bar.
 * Waits for a short pause in typing before hitting the API, and ignores
 * any response that's no longer for the latest query (handles out-of-order
 * network responses gracefully). Also tracks the user's recent-searches
 * list, shown when the search box is focused but empty.
 */
export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse>(EMPTY_RESULTS)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestQueryRef = useRef('')

  useEffect(() => {
    searchApi
      .getHistory()
      .then(setRecentSearches)
      .catch(() => setRecentSearches([]))
  }, [])

  const runSearch = useCallback(async (q: string) => {
    setIsLoading(true)
    try {
      const data = await searchApi.search(q)
      if (latestQueryRef.current === q) setResults(data)

      searchApi
        .recordSearch(q)
        .then(() => {
          setRecentSearches((prev) => {
            const withoutDupe = prev.filter((item) => item.query.toLowerCase() !== q.toLowerCase())
            return [
              { id: `pending-${q}`, query: q, searchedAt: new Date().toISOString() },
              ...withoutDupe,
            ].slice(0, 8)
          })
        })
        .catch(() => {})
    } catch {
      if (latestQueryRef.current === q) setResults(EMPTY_RESULTS)
    } finally {
      if (latestQueryRef.current === q) setIsLoading(false)
    }
  }, [])

  const onQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      const trimmed = value.trim()
      latestQueryRef.current = trimmed

      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (trimmed.length < MIN_QUERY_LENGTH) {
        setResults(EMPTY_RESULTS)
        setIsLoading(false)
        setIsOpen(true)
        return
      }

      setIsOpen(true)
      debounceRef.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS)
    },
    [runSearch]
  )

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery('')
    latestQueryRef.current = ''
    setResults(EMPTY_RESULTS)
    setIsLoading(false)
    setIsOpen(false)
  }, [])

  const selectRecentSearch = useCallback(
    (q: string) => {
      setQuery(q)
      latestQueryRef.current = q
      setIsOpen(true)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      runSearch(q)
    },
    [runSearch]
  )

  const removeRecentSearch = useCallback((id: string) => {
    setRecentSearches((prev) => prev.filter((item) => item.id !== id))
    if (!id.startsWith('pending-')) {
      searchApi.deleteHistoryEntry(id).catch(() => {})
    }
  }, [])

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    searchApi.clearHistory().catch(() => {})
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const hasResults =
    results.users.length > 0 ||
    results.teams.length > 0 ||
    results.departments.length > 0 ||
    results.posts.length > 0

  return {
    query,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    hasResults,
    onQueryChange,
    clear,
    recentSearches,
    selectRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  }
}
