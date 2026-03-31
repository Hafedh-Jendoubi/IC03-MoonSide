'use client'

import { useState } from 'react'
import { Post, User, getFullName } from '@/lib/types'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PostCardProps {
  post: Post
  currentUserId: string
  onLike: (postId: string) => void
  usersMap: Record<string, User>
}

export function PostCard({ post, currentUserId, onLike, usersMap }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const author = usersMap[post.authorId]
  const hasLiked = post.likes.includes(currentUserId)

  const formatTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const AuthorAvatar = ({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' }) => {
    const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-12 w-12 text-sm'
    const name = getFullName(user)
    return user.avatar ? (
      <img src={user.avatar} alt={name} className={`${sizeClass} rounded-full object-cover`} />
    ) : (
      <div
        className={`${sizeClass} bg-primary/10 text-primary flex flex-shrink-0 items-center justify-center rounded-full font-bold`}
      >
        {user.firstName?.[0]?.toUpperCase()}
        {user.lastName?.[0]?.toUpperCase()}
      </div>
    )
  }

  // Author not yet in map (still loading) — show skeleton
  if (!author) {
    return (
      <div className="border-border animate-slide-up bg-background rounded-lg border p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="bg-muted h-12 w-12 animate-pulse rounded-full dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-4 w-32 animate-pulse rounded dark:bg-slate-700" />
            <div className="bg-muted h-3 w-24 animate-pulse rounded dark:bg-slate-700" />
          </div>
        </div>
      </div>
    )
  }

  const authorName = getFullName(author)

  return (
    <div className="border-border animate-slide-up bg-background rounded-lg border p-6 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:shadow-slate-900/50">
      {/* Author Info */}
      <div className="mb-4 flex items-start gap-4">
        <AuthorAvatar user={author} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-semibold">{authorName}</p>
              {author.jobTitle && (
                <p className="text-muted-foreground text-sm">{author.jobTitle}</p>
              )}
            </div>
            <span className="text-muted-foreground text-xs">{formatTime(post.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>

      {/* Stats */}
      <div className="text-muted-foreground border-border flex items-center gap-6 border-t border-b py-3 text-sm dark:border-slate-700">
        <span>{post.likes.length} likes</span>
        <span>{post.comments.length} comments</span>
      </div>

      {/* Actions */}
      <div className="mt-4 mb-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-2 ${hasLiked ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} className="transition-all" />
          Like
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground flex items-center gap-2">
          <MessageCircle size={18} />
          Comment
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground flex items-center gap-2">
          <Share2 size={18} />
          Share
        </Button>
      </div>

      {/* Comments Section */}
      {post.comments.length > 0 && (
        <div className="border-border mt-4 border-t pt-4 dark:border-slate-700">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary mb-3 text-sm hover:underline"
          >
            {isExpanded ? 'Hide' : `Show ${post.comments.length}`} comment
            {post.comments.length !== 1 ? 's' : ''}
          </button>

          {isExpanded && (
            <div className="animate-slide-down space-y-3">
              {post.comments.map((comment) => {
                const commentAuthor = usersMap[comment.authorId]
                if (!commentAuthor) return null

                return (
                  <div key={comment.id} className="flex gap-3">
                    <AuthorAvatar user={commentAuthor} size="sm" />
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3 dark:bg-slate-800">
                        <p className="text-foreground text-sm font-semibold">
                          {getFullName(commentAuthor)}
                        </p>
                        <p className="text-foreground mt-1 text-sm">{comment.content}</p>
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                        <span>{formatTime(comment.timestamp)}</span>
                        <span>{comment.likes.length} likes</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
