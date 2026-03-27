'use client'

import { useState } from 'react'
import { Post, User } from '@/lib/types'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockUsers } from '@/lib/mock-data'

interface PostCardProps {
  post: Post
  currentUserId: string
  onLike: (postId: string) => void
}

export function PostCard({ post, currentUserId, onLike }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const author = mockUsers.find((u) => u.id === post.authorId)
  const hasLiked = post.likes.includes(currentUserId)

  if (!author) return null

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div className="border-border animate-slide-up rounded-lg border bg-white p-6 transition-shadow hover:shadow-md">
      {/* Author Info */}
      <div className="mb-4 flex items-start gap-4">
        <img
          src={author.avatar}
          alt={author.name}
          className="h-12 w-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-semibold">{author.name}</p>
              <p className="text-muted-foreground text-sm">{author.title}</p>
            </div>
            <span className="text-muted-foreground text-xs">{formatTime(post.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>

      {/* Stats */}
      <div className="text-muted-foreground border-border flex items-center gap-6 border-t border-b py-3 text-sm">
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
        <div className="border-border mt-4 border-t pt-4">
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
                const commentAuthor = mockUsers.find((u) => u.id === comment.authorId)
                if (!commentAuthor) return null

                return (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={commentAuthor.avatar}
                      alt={commentAuthor.name}
                      className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-foreground text-sm font-semibold">
                          {commentAuthor.name}
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
