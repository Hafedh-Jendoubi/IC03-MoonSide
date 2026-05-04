'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { postApi, userApi, PostResponse, PageResponse } from '@/lib/api'
import { User } from '@/lib/types'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FeedPage() {
  const { user } = useAuth()

  const [posts, setPosts] = useState<PostResponse[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resolve author ids that aren't in the map yet
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

  // Initial load
  const loadFeed = useCallback(
    async (pageNum = 0) => {
      try {
        if (pageNum === 0) setLoading(true)
        else setLoadingMore(true)
        setError(null)

        const data: PageResponse<PostResponse> = await postApi.getFeed(pageNum, 20)
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

  useEffect(() => {
    loadFeed(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePostCreate = async (newPost: PostResponse) => {
    setPosts((prev) => [newPost, ...prev])
    // Author is the current user — already in usersMap if we seed it
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

  return (
    <AuthLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Create Post */}
        <CreatePost user={user} onPostCreate={handlePostCreate} />

        {/* Feed */}
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
            <div className="space-y-6">
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

            {/* Empty state */}
            {posts.length === 0 && (
              <div className="py-12 text-center">
                <div className="mb-4 text-6xl">📝</div>
                <h2 className="text-foreground mb-2 text-xl font-semibold">No posts yet</h2>
                <p className="text-muted-foreground">
                  Be the first to share something with your team!
                </p>
              </div>
            )}

            {/* Load more */}
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
