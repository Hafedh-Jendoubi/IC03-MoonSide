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
  const author = mockUsers.find(u => u.id === post.authorId)
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
    <div className="bg-white border border-border rounded-lg p-6 hover:shadow-md transition-shadow animate-slide-up">
      {/* Author Info */}
      <div className="flex items-start gap-4 mb-4">
        <img
          src={author.avatar}
          alt={author.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{author.name}</p>
              <p className="text-sm text-muted-foreground">{author.title}</p>
            </div>
            <span className="text-xs text-muted-foreground">{formatTime(post.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground py-3 border-t border-b border-border">
        <span>{post.likes.length} likes</span>
        <span>{post.comments.length} comments</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-2 ${hasLiked ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} className="transition-all" />
          Like
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
          <MessageCircle size={18} />
          Comment
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
          <Share2 size={18} />
          Share
        </Button>
      </div>

      {/* Comments Section */}
      {post.comments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-primary hover:underline mb-3"
          >
            {isExpanded ? 'Hide' : `Show ${post.comments.length}`} comment{post.comments.length !== 1 ? 's' : ''}
          </button>

          {isExpanded && (
            <div className="space-y-3 animate-slide-down">
              {post.comments.map(comment => {
                const commentAuthor = mockUsers.find(u => u.id === comment.authorId)
                if (!commentAuthor) return null

                return (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={commentAuthor.avatar}
                      alt={commentAuthor.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="font-semibold text-sm text-foreground">{commentAuthor.name}</p>
                        <p className="text-sm text-foreground mt-1">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
