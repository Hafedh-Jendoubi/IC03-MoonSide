'use client'

import { useState, useEffect, useCallback } from 'react'
import { PostResponse, CommentResponse, commentApi, reactionApi } from '@/lib/api'
import { User, getFullName, PostType } from '@/lib/types'
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Edit2,
  Pin,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ── Helpers ───────────────────────────────────────────────────────────────────

const POST_TYPE_STYLES: Record<PostType, { label: string; color: string }> = {
  DISCUSSION: {
    label: 'Discussion',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  },
  ANNOUNCEMENT: {
    label: 'Announcement',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
  UPDATE: {
    label: 'Update',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  },
  QUESTION: {
    label: 'Question',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  },
  EVENT: {
    label: 'Event',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  },
  ACHIEVEMENT: {
    label: 'Achievement',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  },
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
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

// ── Sub-components ────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 'md' }: { user: User | null; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-12 w-12 text-sm'
  if (!user) {
    return (
      <div
        className={`${sizeClass} bg-muted flex-shrink-0 animate-pulse rounded-full dark:bg-slate-700`}
      />
    )
  }
  const name = getFullName(user)
  return user.avatar ? (
    <img
      src={user.avatar}
      alt={name}
      className={`${sizeClass} flex-shrink-0 rounded-full object-cover`}
    />
  ) : (
    <div
      className={`${sizeClass} bg-primary/10 text-primary flex flex-shrink-0 items-center justify-center rounded-full font-bold`}
    >
      {user.firstName?.[0]?.toUpperCase()}
      {user.lastName?.[0]?.toUpperCase()}
    </div>
  )
}

// ── Comment row ───────────────────────────────────────────────────────────────

function CommentRow({
  comment,
  usersMap,
  currentUserId,
  postId,
  onDeleted,
}: {
  comment: CommentResponse
  usersMap: Record<string, User>
  currentUserId: string
  postId: string
  onDeleted: (id: string) => void
}) {
  const author = usersMap[comment.authorId]
  const isOwn = comment.authorId === currentUserId
  const [likeCount, setLikeCount] = useState(comment.reactionCount)
  const [liked, setLiked] = useState(false)

  const handleLike = async () => {
    try {
      const res = await reactionApi.reactToComment(postId, comment.id, {
        reactionTypeCode: 'LIKE',
      })
      if (res) {
        setLiked(true)
        setLikeCount((c) => c + 1)
      } else {
        setLiked(false)
        setLikeCount((c) => Math.max(0, c - 1))
      }
    } catch (e) {
      console.error('Failed to react to comment:', e)
    }
  }

  const handleDelete = async () => {
    try {
      await commentApi.deleteComment(postId, comment.id)
      onDeleted(comment.id)
    } catch (e) {
      console.error('Failed to delete comment:', e)
    }
  }

  return (
    <div className="flex gap-3">
      <UserAvatar user={author} size="sm" />
      <div className="flex-1">
        <div className="bg-muted rounded-2xl px-4 py-3 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm font-semibold">
              {author ? getFullName(author) : 'Unknown user'}
            </p>
            {isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-foreground mt-1 text-sm leading-relaxed">{comment.content}</p>
        </div>
        <div className="text-muted-foreground mt-1 flex items-center gap-3 pl-3 text-xs">
          <span>{formatTime(comment.createdAt)}</span>
          <button
            onClick={handleLike}
            className={`hover:text-primary transition-colors ${liked ? 'text-primary font-semibold' : ''}`}
          >
            {liked ? '❤️' : '🤍'} {likeCount > 0 ? likeCount : ''}
          </button>
          {comment.isEdited && <span className="italic">edited</span>}
        </div>
      </div>
    </div>
  )
}

// ── Main PostCard ─────────────────────────────────────────────────────────────

interface PostCardProps {
  post: PostResponse
  currentUserId: string
  usersMap: Record<string, User>
  onDelete?: (postId: string) => void
}

export function PostCard({ post, currentUserId, usersMap, onDelete }: PostCardProps) {
  const [reactionCount, setReactionCount] = useState(post.reactionCount)
  const [hasLiked, setHasLiked] = useState(false)
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [showComments, setShowComments] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const author = usersMap[post.authorId]
  const isOwn = post.authorId === currentUserId

  // Fetch initial reaction state
  useEffect(() => {
    reactionApi
      .getPostReactions(post.id)
      .then((summary) => {
        setReactionCount(summary.total)
        setHasLiked(!!summary.userReaction)
      })
      .catch(() => {})
  }, [post.id])

  const loadComments = useCallback(async () => {
    if (loadingComments) return
    setLoadingComments(true)
    try {
      const page = await commentApi.getComments(post.id)
      setComments(page.content)
    } catch (e) {
      console.error('Failed to load comments:', e)
    } finally {
      setLoadingComments(false)
    }
  }, [post.id, loadingComments])

  const toggleComments = () => {
    if (!showComments && comments.length === 0) loadComments()
    setShowComments((s) => !s)
  }

  const handleLike = async () => {
    try {
      const res = await reactionApi.reactToPost(post.id, { reactionTypeCode: 'LIKE' })
      if (res) {
        setHasLiked(true)
        setReactionCount((c) => c + 1)
      } else {
        setHasLiked(false)
        setReactionCount((c) => Math.max(0, c - 1))
      }
    } catch (e) {
      console.error('Failed to react to post:', e)
    }
  }

  const handleDelete = async () => {
    try {
      const { postApi } = await import('@/lib/api')
      await postApi.delete(post.id)
      onDelete?.(post.id)
    } catch (e) {
      console.error('Failed to delete post:', e)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submittingComment) return
    setSubmittingComment(true)
    try {
      const comment = await commentApi.addComment(post.id, { content: newComment.trim() })
      setComments((prev) => [...prev, comment])
      setCommentCount((c) => c + 1)
      setNewComment('')
    } catch (e) {
      console.error('Failed to add comment:', e)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    setCommentCount((c) => Math.max(0, c - 1))
  }

  const typeStyle = POST_TYPE_STYLES[post.postType] ?? POST_TYPE_STYLES.DISCUSSION

  return (
    <div className="border-border animate-slide-up bg-background rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-4 flex items-start gap-4">
        <UserAvatar user={author} />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-foreground font-semibold">
                {author ? getFullName(author) : 'Unknown user'}
              </p>
              {post.isPinned && <Pin size={12} className="text-primary shrink-0" />}
              <Badge className={`${typeStyle.color} border-0 text-xs`}>{typeStyle.label}</Badge>
            </div>
            {author?.jobTitle && (
              <p className="text-muted-foreground truncate text-sm">{author.jobTitle}</p>
            )}
            <p className="text-muted-foreground text-xs">{formatTime(post.createdAt)}</p>
          </div>

          {/* Options menu (own posts only) */}
          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-foreground mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Stats bar */}
      <div className="text-muted-foreground border-border flex items-center gap-6 border-t border-b py-2.5 text-sm dark:border-slate-700">
        <span>
          {reactionCount} {reactionCount === 1 ? 'reaction' : 'reactions'}
        </span>
        <button onClick={toggleComments} className="hover:text-foreground transition-colors">
          {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      {/* Action buttons */}
      <div className="my-3 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={`flex items-center gap-2 ${hasLiked ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} className="transition-all" />
          {hasLiked ? 'Liked' : 'Like'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleComments}
          className="text-muted-foreground flex items-center gap-2"
        >
          <MessageCircle size={18} />
          Comment
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground flex items-center gap-2">
          <Share2 size={18} />
          Share
        </Button>
        {commentCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleComments}
            className="text-muted-foreground ml-auto flex items-center gap-1 text-xs"
          >
            {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showComments ? 'Hide' : 'Show'} comments
          </Button>
        )}
      </div>

      {/* Comment section */}
      {showComments && (
        <div className="border-border mt-2 border-t pt-4 dark:border-slate-700">
          {/* Add comment */}
          <form onSubmit={handleAddComment} className="mb-4 flex items-center gap-3">
            <UserAvatar user={usersMap[currentUserId]} size="sm" />
            <div className="flex flex-1 items-center gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment…"
                maxLength={2000}
                className="bg-muted text-foreground placeholder-muted-foreground focus:ring-primary/30 flex-1 rounded-full px-4 py-2 text-sm focus:ring-2 focus:outline-none dark:bg-slate-800"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newComment.trim() || submittingComment}
                className="h-8 w-8 shrink-0"
              >
                <Send size={14} />
              </Button>
            </div>
          </form>

          {/* Comments list */}
          {loadingComments ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="bg-muted h-8 w-8 animate-pulse rounded-full dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted h-14 animate-pulse rounded-2xl dark:bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  usersMap={usersMap}
                  currentUserId={currentUserId}
                  postId={post.id}
                  onDeleted={handleCommentDeleted}
                />
              ))}
              {comments.length === 0 && (
                <p className="text-muted-foreground text-center text-sm">No comments yet.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
