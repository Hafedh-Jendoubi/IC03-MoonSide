'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { searchApi } from '@/lib/api'
import type { SearchHistoryItem, SearchResponse } from '@/lib/api/types/search'

const EMPTY_RESULTS: SearchResponse = { users: [], teams: [], posts: [] }
const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 300

/**
 * Debounced "search as you type" hook for the navbar search bar.
 * Waits for a short pause in typing before hitting the API, and ignores
 * any response that's no longer for the latest query (handles out-of-order
 * network responses gracefully).
 *
 * Also tracks the signed-in user's recent search terms (synced to their
 * account via Search-Service), so the dropdown can offer them as soon as
 * the field is focused, before anything is even typed.
 */
export function useSearch(userId: string | undefined) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse>(EMPTY_RESULTS)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestQueryRef = useRef('')

  // ── Recent searches ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setHistory([])
      return
    }
    searchApi
      .getHistory()
      .then(setHistory)
      .catch(() => {})
  }, [userId])

  /** Remembers a search term. Safe to call freely — no-ops while signed out or below the minimum length. */
  const recordSearch = useCallback(
    (q: string) => {
      if (!userId || q.trim().length < MIN_QUERY_LENGTH) return
      searchApi
        .addHistoryEntry(q.trim())
        .then(() => searchApi.getHistory())
        .then(setHistory)
        .catch(() => {})
    },
    [userId]
  )

  const removeHistoryEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id)) // optimistic
    searchApi.deleteHistoryEntry(id).catch(() => {})
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([]) // optimistic
    searchApi.clearHistory().catch(() => {})
  }, [])

  // ── Search-as-you-type ──────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    setIsLoading(true)
    try {
      const data = await searchApi.search(q)
      if (latestQueryRef.current === q) setResults(data)
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
      // Stay open while the field is being edited — when empty, the
      // dropdown shows recent searches instead of live results.
      setIsOpen(true)

      if (trimmed.length < MIN_QUERY_LENGTH) {
        setResults(EMPTY_RESULTS)
        setIsLoading(false)
        return
      }

      debounceRef.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS)
    },
    [runSearch]
  )

  /** Re-runs a past search term, e.g. when the user picks it from "Recent searches". */
  const selectHistoryQuery = useCallback(
    (q: string) => {
      setQuery(q)
      latestQueryRef.current = q
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setIsOpen(true)
      runSearch(q)
      recordSearch(q)
    },
    [runSearch, recordSearch]
  )

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery('')
    latestQueryRef.current = ''
    setResults(EMPTY_RESULTS)
    setIsLoading(false)
    setIsOpen(false)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const hasResults =
    results.users.length > 0 || results.teams.length > 0 || results.posts.length > 0

  return {
    query,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    hasResults,
    onQueryChange,
    clear,
    history,
    recordSearch,
    selectHistoryQuery,
    removeHistoryEntry,
    clearHistory,
  }
}
