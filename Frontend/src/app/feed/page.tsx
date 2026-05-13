'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { postApi, userApi, departmentApi, teamApi, PostResponse } from '@/lib/api'
import { User } from '@/lib/types'
import { Loader2, RefreshCw, Globe, Users, BookmarkX, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Cached label for a dept/team ID so we only fetch each name once. */
type OriginLabel = { kind: 'department' | 'team'; name: string }

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { user } = useAuth()

  const [posts, setPosts] = useState<PostResponse[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [originsMap, setOriginsMap] = useState<Record<string, OriginLabel>>({})
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Origin resolution (dept / team names) ─────────────────────────────────

  const resolveOrigins = useCallback(
    async (newPosts: PostResponse[]) => {
      const missingDepts = [
        ...new Set(
          newPosts.map((p) => p.departmentId).filter((id): id is string => !!id && !originsMap[id])
        ),
      ]
      const missingTeams = [
        ...new Set(
          newPosts.map((p) => p.teamId).filter((id): id is string => !!id && !originsMap[id])
        ),
      ]

      if (missingDepts.length === 0 && missingTeams.length === 0) return

      const [deptResults, teamResults] = await Promise.all([
        Promise.allSettled(missingDepts.map((id) => departmentApi.getById(id))),
        Promise.allSettled(missingTeams.map((id) => teamApi.getById(id))),
      ])

      const updates: Record<string, OriginLabel> = {}
      deptResults.forEach((r, i) => {
        if (r.status === 'fulfilled')
          updates[missingDepts[i]] = { kind: 'department', name: (r.value as any).name }
      })
      teamResults.forEach((r, i) => {
        if (r.status === 'fulfilled')
          updates[missingTeams[i]] = { kind: 'team', name: (r.value as any).name }
      })

      setOriginsMap((prev) => ({ ...prev, ...updates }))
    },
    [originsMap]
  )

  // ── Author resolution ──────────────────────────────────────────────────────

  const resolveAuthors = useCallback(
    async (newPosts: PostResponse[]) => {
      const missing = [...new Set(newPosts.map((p) => p.authorId).filter((id) => !usersMap[id]))]
      if (missing.length === 0) return

      const results = await Promise.allSettled(missing.map((id) => userApi.getById(id)))
      const updates: Record<string, User> = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') updates[missing[i]] = r.value as User
      })
      setUsersMap((prev) => ({ ...prev, ...updates }))
    },
    [usersMap]
  )

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadFeed = useCallback(
    async (pageNum = 0) => {
      try {
        if (pageNum === 0) {
          setLoading(true)
          setPosts([])
        } else {
          setLoadingMore(true)
        }
        setError(null)

        const data = await postApi.getFollowingFeed(pageNum, 20)

        if (pageNum === 0) {
          setPosts(data.content)
        } else {
          setPosts((prev) => [...prev, ...data.content])
        }

        setTotalPages(data.totalPages)
        setPage(pageNum)
        await Promise.all([resolveAuthors(data.content), resolveOrigins(data.content)])
      } catch (err) {
        console.error('Failed to load feed:', err)
        setError('Could not load posts. Please try again.')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [resolveAuthors, resolveOrigins]
  )

  useEffect(() => {
    loadFeed(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Post lifecycle ─────────────────────────────────────────────────────────

  const handlePostCreate = (newPost: PostResponse) => {
    setPosts((prev) => [newPost, ...prev])
    if (user && !usersMap[user.id]) {
      setUsersMap((prev) => ({ ...prev, [user.id]: user }))
    }
  }

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const handlePostUpdate = (updated: PostResponse) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  // Seed current user into the map so their own posts render immediately
  useEffect(() => {
    if (user && !usersMap[user.id]) {
      setUsersMap((prev) => ({ ...prev, [user.id]: user }))
    }
  }, [user, usersMap])

  if (!user) return null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AuthLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <CreatePost user={user} onPostCreate={handlePostCreate} />

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading your feed…</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => loadFeed(0)}>
              <RefreshCw size={16} className="mr-2" /> Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-6">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  style={{ animation: `slide-up 0.3s ease-out ${index * 40}ms both` }}
                >
                  <PostOriginBadge post={post} originsMap={originsMap} />
                  <PostCard
                    post={post}
                    currentUserId={user.id}
                    usersMap={usersMap}
                    onDelete={handlePostDelete}
                    onUpdate={handlePostUpdate}
                  />
                </div>
              ))}
            </div>

            {posts.length === 0 && <FollowingEmptyState />}

            {page + 1 < totalPages && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={() => loadFeed(page + 1)} disabled={loadingMore}>
                  {loadingMore ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  )
}

// ─── PostOriginBadge ──────────────────────────────────────────────────────────

function PostOriginBadge({
  post,
  originsMap,
}: {
  post: PostResponse
  originsMap: Record<string, OriginLabel>
}) {
  const id = post.teamId ?? post.departmentId
  if (!id) return null

  const origin = originsMap[id]

  if (!origin) {
    return (
      <div className="mb-1.5 flex items-center gap-1.5 px-1">
        <div className="bg-muted h-3 w-32 animate-pulse rounded" />
      </div>
    )
  }

  const isTeam = origin.kind === 'team'

  return (
    <div className="mb-1.5 flex items-center gap-1.5 px-1">
      <span className="text-muted-foreground text-xs">Posted in</span>
      <Link
        href={isTeam ? `/team/${id}` : `/department/${id}`}
        className="bg-muted/60 text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors"
      >
        {isTeam ? (
          <Users size={11} className="shrink-0 text-blue-500" />
        ) : (
          <Building2 size={11} className="shrink-0 text-violet-500" />
        )}
        {origin.name}
      </Link>
    </div>
  )
}

// ─── FollowingEmptyState ──────────────────────────────────────────────────────

function FollowingEmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <BookmarkX className="text-muted-foreground h-8 w-8" />
      </div>
      <h2 className="text-foreground mb-2 text-xl font-semibold">Your feed is empty</h2>
      <p className="text-muted-foreground mx-auto mb-6 max-w-sm text-sm">
        Follow departments or teams to see their posts here. Everything posted there will appear in
        your personal feed.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/discover">
            <Globe size={16} className="mr-2" />
            Browse departments &amp; teams
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/organizations">
            <Users size={16} className="mr-2" />
            View organisation
          </Link>
        </Button>
      </div>
    </div>
  )
}
