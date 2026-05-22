'use client'

import { useState, useEffect } from 'react'
import { Loader2, Bookmark, BookmarkX } from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'
import { PostCard } from '@/components/post-card'
import { savedPostApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { PostResponse } from '@/lib/api'

export default function SavedPostsPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    savedPostApi
      .getSaved()
      .then(setPosts)
      .catch((e: any) => setError(e.message ?? 'Failed to load saved posts'))
      .finally(() => setLoading(false))
  }, [])

  const handleUnsave = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  if (!user) return null

  return (
    <AuthLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
            <Bookmark className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold">Saved Posts</h1>
            <p className="text-muted-foreground text-sm">Posts you've saved for later</p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading saved posts…</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <BookmarkX className="text-muted-foreground/40 h-16 w-16" />
            <div>
              <h2 className="text-foreground mb-1 text-lg font-semibold">No saved posts yet</h2>
              <p className="text-muted-foreground text-sm">
                When you save a post, it'll show up here so you can find it later.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-muted-foreground text-sm">
              {posts.length} saved post{posts.length !== 1 ? 's' : ''}
            </p>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user.id}
                usersMap={{}}
                onDelete={handleUnsave}
                onUpdate={(updated) =>
                  setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                }
              />
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
