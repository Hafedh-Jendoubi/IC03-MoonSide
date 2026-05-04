'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { usePostFeed } from '@/hooks/use-post-feed'
import { PostResponse } from '@/lib/api'
import { User, PostVisibility } from '@/lib/types'

interface PostFeedProps {
  currentUser: User
  /** Provide for a team-scoped feed */
  teamId?: string
  /** Provide for a department-scoped feed */
  departmentId?: string
  /** Provide for a user profile feed */
  authorId?: string
  /** Override the default visibility preset in CreatePost */
  defaultVisibility?: PostVisibility
  emptyMessage?: string
}

export function PostFeed({
  currentUser,
  teamId,
  departmentId,
  authorId,
  defaultVisibility,
  emptyMessage = 'Be the first to share something!',
}: PostFeedProps) {
  const scope = teamId
    ? { type: 'team' as const, teamId }
    : departmentId
      ? { type: 'department' as const, departmentId }
      : authorId
        ? { type: 'author' as const, authorId }
        : { type: 'global' as const }

  const {
    posts,
    usersMap,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    prependPost,
    removePost,
  } = usePostFeed({ scope, currentUser })

  const handlePostCreate = (post: PostResponse) => {
    prependPost(post)
  }

  return (
    <div className="space-y-6">
      {/* Only show the composer when the user can author posts here.
          Hide it on the "by author" (profile) view since you can't post as someone else. */}
      {!authorId && (
        <CreatePost
          user={currentUser}
          onPostCreate={handlePostCreate}
          teamId={teamId}
          departmentId={departmentId}
          defaultVisibility={defaultVisibility}
        />
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading posts…</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={refresh}>
            <RefreshCw size={16} className="mr-2" />
            Retry
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl">📝</div>
          <h2 className="text-foreground mb-2 text-xl font-semibold">No posts yet</h2>
          <p className="text-muted-foreground">{emptyMessage}</p>
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
                  currentUserId={currentUser.id}
                  usersMap={usersMap}
                  onDelete={removePost}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
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
  )
}
