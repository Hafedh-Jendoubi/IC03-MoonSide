'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { postApi, userApi, PostResponse, PageResponse } from '@/lib/api'
import { User } from '@/lib/types'

type FeedScope =
  | { type: 'global' }
  | { type: 'team'; teamId: string }
  | { type: 'department'; departmentId: string }
  | { type: 'author'; authorId: string }

interface UseFeedOptions {
  scope: FeedScope
  pageSize?: number
  /** Seed the users map with the logged-in user so own posts render immediately. */
  currentUser?: User | null
}

interface UseFeedResult {
  posts: PostResponse[]
  usersMap: Record<string, User>
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
  prependPost: (post: PostResponse) => void
  removePost: (postId: string) => void
  updatePost: (updated: PostResponse) => void
  /** Attach this ref to a sentinel element at the bottom of the list to trigger infinite scroll. */
  sentinelRef: (node: HTMLDivElement | null) => void
}

export function usePostFeed({ scope, pageSize = 5, currentUser }: UseFeedOptions): UseFeedResult {
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track resolved IDs to avoid redundant fetches
  const resolvedIds = useRef<Set<string>>(new Set())
  // Guard against concurrent loadMore calls
  const loadingMoreRef = useRef(false)
  const pageRef = useRef(0)
  const totalPagesRef = useRef(1)

  // Seed current user immediately
  useEffect(() => {
    if (currentUser && !resolvedIds.current.has(currentUser.id)) {
      resolvedIds.current.add(currentUser.id)
      setUsersMap((prev) => ({ ...prev, [currentUser.id]: currentUser }))
    }
  }, [currentUser])

  const resolveAuthors = useCallback(async (newPosts: PostResponse[]) => {
    const missing = [
      ...new Set(newPosts.map((p) => p.authorId).filter((id) => !resolvedIds.current.has(id))),
    ]
    if (missing.length === 0) return

    missing.forEach((id) => resolvedIds.current.add(id))

    const results = await Promise.allSettled(missing.map((id) => userApi.getById(id)))
    const updates: Record<string, User> = {}
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') updates[missing[i]] = r.value as User
    })
    setUsersMap((prev) => ({ ...prev, ...updates }))
  }, [])

  const fetchPage = useCallback(
    async (pageNum: number) => {
      let data: PageResponse<PostResponse>

      switch (scope.type) {
        case 'team':
          data = await postApi.getByTeam(scope.teamId, pageNum, pageSize)
          break
        case 'department':
          data = await postApi.getByDepartment(scope.departmentId, pageNum, pageSize)
          break
        case 'author':
          data = await postApi.getByAuthor(scope.authorId, pageNum, pageSize)
          break
        default:
          data = await postApi.getFeed(pageNum, pageSize)
      }

      return data
    },
    [scope, pageSize]
  )

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (pageNum === 0) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
        loadingMoreRef.current = true
      }

      try {
        const data = await fetchPage(pageNum)
        if (pageNum === 0) {
          setPosts(data.content)
        } else {
          setPosts((prev) => [...prev, ...data.content])
        }
        setTotalPages(data.totalPages)
        totalPagesRef.current = data.totalPages
        setPage(pageNum)
        pageRef.current = pageNum
        await resolveAuthors(data.content)
      } catch (err) {
        console.error('Failed to load posts:', err)
        setError('Could not load posts. Please try again.')
      } finally {
        setLoading(false)
        setLoadingMore(false)
        loadingMoreRef.current = false
      }
    },
    [fetchPage, resolveAuthors]
  )

  // Initial load & re-load when scope changes
  useEffect(() => {
    setPosts([])
    setPage(0)
    pageRef.current = 0
    setTotalPages(1)
    totalPagesRef.current = 1
    resolvedIds.current = currentUser ? new Set([currentUser.id]) : new Set()
    loadPage(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.type, (scope as any).teamId, (scope as any).departmentId, (scope as any).authorId])

  const loadMore = useCallback(() => {
    if (!loadingMoreRef.current && pageRef.current + 1 < totalPagesRef.current) {
      loadPage(pageRef.current + 1)
    }
  }, [loadPage])

  // ── Infinite scroll via IntersectionObserver ─────────────────────────────
  const observerRef = useRef<IntersectionObserver | null>(null)

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect()
      if (!node) return

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMore()
          }
        },
        { rootMargin: '200px' }
      )
      observerRef.current.observe(node)
    },
    [loadMore]
  )

  const refresh = useCallback(() => {
    setPosts([])
    setPage(0)
    pageRef.current = 0
    loadPage(0)
  }, [loadPage])

  const prependPost = useCallback(
    (post: PostResponse) => {
      setPosts((prev) => [post, ...prev])
      if (currentUser && !resolvedIds.current.has(currentUser.id)) {
        resolvedIds.current.add(currentUser.id)
        setUsersMap((prev) => ({ ...prev, [currentUser.id]: currentUser }))
      }
    },
    [currentUser]
  )

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  const updatePost = useCallback((updated: PostResponse) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }, [])

  return {
    posts,
    usersMap,
    loading,
    loadingMore,
    error,
    hasMore: page + 1 < totalPages,
    loadMore,
    refresh,
    prependPost,
    removePost,
    updatePost,
    sentinelRef,
  }
}
