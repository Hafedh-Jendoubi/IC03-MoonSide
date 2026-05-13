'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { postApi, userApi, PostResponse, PageResponse } from '@/lib/api'
import { User } from '@/lib/types'
import { Loader2, RefreshCw, Rss, Globe, Users, BookmarkX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedTab = 'following' | 'discover'

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<FeedTab>('following')
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prevent stale closure issues when tab switches trigger a reload
  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab

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
    async (tab: FeedTab, pageNum = 0) => {
      try {
        if (pageNum === 0) {
          setLoading(true)
          setPosts([])
        } else {
          setLoadingMore(true)
        }
        setError(null)

        let data: PageResponse<PostResponse>

        if (tab === 'following') {
          data = await postApi.getFollowingFeed(pageNum, 20)
        } else {
          data = await postApi.getFeed(pageNum, 20)
        }

        if (pageNum === 0) {
          setPosts(data.content)
        } else {
          setPosts((prev) => [...prev, ...data.content])
        }

        setTotalPages(data.totalPages)
        setPage(pageNum)
        await resolveAuthors(data.content)
      } catch (err) {
        console.error('Failed to load feed:', err)
        setError('Could not load posts. Please try again.')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [resolveAuthors]
  )

  // Initial load
  useEffect(() => {
    loadFeed('following', 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reload when tab changes
  const handleTabChange = (tab: FeedTab) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    loadFeed(tab, 0)
  }

  // ── Post lifecycle ─────────────────────────────────────────────────────────

  const handlePostCreate = async (newPost: PostResponse) => {
    // Only prepend to the current tab if the post belongs there
    const isFollowingTab = activeTab === 'following'
    const isPublic = newPost.postVisibility === 'PUBLIC'

    // For the following tab: new posts that have a teamId or departmentId are
    // guaranteed to appear in the feed (user created them so they follow the context).
    // For the discover tab: only PUBLIC posts appear.
    if (isFollowingTab || isPublic) {
      setPosts((prev) => [newPost, ...prev])
    }

    if (user && !usersMap[user.id]) {
      setUsersMap((prev) => ({ ...prev, [user.id]: user }))
    }
  }

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
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
        {/* Create Post */}
        <CreatePost user={user} onPostCreate={handlePostCreate} />

        {/* Tab bar */}
        <div className="bg-muted mt-6 mb-2 flex gap-1 rounded-lg border p-1">
          <TabButton
            active={activeTab === 'following'}
            onClick={() => handleTabChange('following')}
            icon={<Rss size={15} />}
            label="Following"
          />
          <TabButton
            active={activeTab === 'discover'}
            onClick={() => handleTabChange('discover')}
            icon={<Globe size={15} />}
            label="Discover"
          />
        </div>

        {/* Feed body */}
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading your feed…</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => loadFeed(activeTab, 0)}>
              <RefreshCw size={16} className="mr-2" /> Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-6">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  style={{ animation: `slide-up 0.3s ease-out ${index * 40}ms both` }}
                >
                  <PostCard
                    post={post}
                    currentUserId={user.id}
                    usersMap={usersMap}
                    onDelete={handlePostDelete}
                  />
                </div>
              ))}
            </div>

            {/* Empty states */}
            {posts.length === 0 && activeTab === 'following' && <FollowingEmptyState />}

            {posts.length === 0 && activeTab === 'discover' && (
              <div className="py-12 text-center">
                <div className="mb-4 text-6xl">📝</div>
                <h2 className="text-foreground mb-2 text-xl font-semibold">No public posts yet</h2>
                <p className="text-muted-foreground">
                  Be the first to share something with the organisation!
                </p>
              </div>
            )}

            {/* Load more */}
            {page + 1 < totalPages && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => loadFeed(activeTab, page + 1)}
                  disabled={loadingMore}
                >
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}

function FollowingEmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <BookmarkX className="text-muted-foreground h-8 w-8" />
      </div>
      <h2 className="text-foreground mb-2 text-xl font-semibold">Your feed is empty</h2>
      <p className="text-muted-foreground mx-auto mb-6 max-w-sm text-sm">
        Follow departments or teams to see their posts here. Everything posted there — including
        comments — will appear in your personal feed.
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
