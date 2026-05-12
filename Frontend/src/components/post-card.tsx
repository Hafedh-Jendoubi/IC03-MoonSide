'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { PostResponse, CommentResponse, commentApi, reactionApi, userApi, postApi } from '@/lib/api'
import { User, getFullName, PostType, ROLE, hasRole } from '@/lib/types'
import {
  Heart,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Pin,
  ChevronDown,
  ChevronUp,
  Send,
  Pencil,
  X,
  Check,
  CornerDownRight,
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
import { useAuth } from '@/lib/auth-context'
import { UsersModal, ModalUser } from '@/components/users-modal'

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

// ── Reaction types ─────────────────────────────────────────────────────────────

const REACTION_TYPES = [
  { code: 'LIKE', emoji: '👍', label: 'Like', Icon: ThumbsUp },
  { code: 'LOVE', emoji: '❤️', label: 'Love', Icon: Heart },
  { code: 'CLAP', emoji: '👏', label: 'Clap', Icon: null },
  { code: 'WOW', emoji: '😮', label: 'Wow', Icon: null },
  { code: 'HAHA', emoji: '😂', label: 'Haha', Icon: null },
] as const

type ReactionCode = (typeof REACTION_TYPES)[number]['code']

// ── ReactionPicker (floating emoji bar) ────────────────────────────────────────

function ReactionPicker({
  onSelect,
  onClose,
}: {
  onSelect: (code: ReactionCode) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="border-border bg-background absolute bottom-full left-0 z-50 mb-2 flex items-center gap-1 rounded-full border px-2 py-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
    >
      {REACTION_TYPES.map(({ code, emoji, label }) => (
        <button
          key={code}
          title={label}
          onClick={() => {
            onSelect(code)
            onClose()
          }}
          className="group flex flex-col items-center"
        >
          <span className="text-xl transition-transform duration-100 group-hover:-translate-y-1 group-hover:scale-125">
            {emoji}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── ReactionButton (post & comment shared) ─────────────────────────────────────

function ReactionButton({
  reactionCode,
  reactionCount,
  onReact,
  size = 'post',
}: {
  reactionCode: ReactionCode | null
  reactionCount: number
  onReact: (code: ReactionCode) => Promise<void>
  size?: 'post' | 'comment'
}) {
  const [showPicker, setShowPicker] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const active = REACTION_TYPES.find((r) => r.code === reactionCode)

  const handlePressStart = () => {
    holdTimer.current = setTimeout(() => setShowPicker(true), 400)
  }
  const handlePressEnd = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
  }

  const handleClick = () => {
    if (showPicker) return
    // quick click: toggle LIKE or remove existing
    if (active) {
      onReact(active.code) // toggles off
    } else {
      onReact('LIKE')
    }
  }

  const handleSelect = (code: ReactionCode) => {
    onReact(code)
  }

  if (size === 'comment') {
    // Compact inline style for comments
    return (
      <div ref={containerRef} className="relative inline-flex items-center">
        {showPicker && (
          <ReactionPicker onSelect={handleSelect} onClose={() => setShowPicker(false)} />
        )}
        <button
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onClick={handleClick}
          className={`hover:text-primary flex items-center gap-1 transition-colors ${active ? 'text-primary font-semibold' : ''}`}
        >
          <span className="text-sm leading-none">{active ? active.emoji : '👍'}</span>
          {!active && <span>Like</span>}
        </button>
      </div>
    )
  }

  // Post size — full button
  return (
    <div ref={containerRef} className="relative">
      {showPicker && (
        <ReactionPicker onSelect={handleSelect} onClose={() => setShowPicker(false)} />
      )}
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onClick={handleClick}
        className={`flex items-center gap-2 ${active ? 'text-primary' : 'text-muted-foreground'}`}
      >
        {active ? (
          <>
            <span className="text-base leading-none">{active.emoji}</span>
            <span>{active.label}</span>
          </>
        ) : (
          <>
            <ThumbsUp size={18} className="transition-all" />
            <span>Like</span>
          </>
        )}
      </Button>
    </div>
  )
}

// ── formatTime ─────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return dateStr

  const now = new Date()
  const diffMs = Math.max(0, now.getTime() - d.getTime())
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)
  const diffMonths = Math.floor(diffDays / 30.44)
  const diffYears = Math.floor(diffDays / 365.25)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`

  if (diffYears < 1) {
    return `${diffMonths}mo ago`
  }

  const remainingMonths = diffMonths - diffYears * 12
  if (remainingMonths === 0) return `${diffYears}y ago`
  return `${diffYears}y ${remainingMonths}mo ago`
}

// ── fetchReactors ─────────────────────────────────────────────────────────────

async function fetchReactors(
  reactions: Awaited<ReturnType<typeof reactionApi.getPostReactors>>
): Promise<ModalUser[]> {
  const uniqueIds = [...new Set(reactions.map((r) => r.userId))]
  const settled = await Promise.allSettled(uniqueIds.map((id) => userApi.getById(id)))
  const userMap: Record<string, User> = {}
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') userMap[uniqueIds[i]] = r.value as User
  })
  return reactions
    .map((r) => {
      const u = userMap[r.userId]
      if (!u) return null
      return {
        id: u.id,
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        email: u.email ?? '',
        avatar: u.avatar ?? null,
        jobTitle: u.jobTitle ?? null,
        emoji: r.reactionTypeEmoji,
      } satisfies ModalUser
    })
    .filter((u): u is ModalUser => u !== null)
}

// ── UserAvatar ────────────────────────────────────────────────────────────────

function UserAvatar({
  user,
  size = 'md',
  clickable = false,
}: {
  user: User | null | undefined
  size?: 'sm' | 'md' | 'xs'
  clickable?: boolean
}) {
  const sizeClass =
    size === 'xs' ? 'h-6 w-6 text-[10px]' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-12 w-12 text-sm'
  if (!user) {
    return (
      <div
        className={`${sizeClass} bg-muted flex-shrink-0 animate-pulse rounded-full dark:bg-slate-700`}
      />
    )
  }
  const name = getFullName(user)
  const avatar = user.avatar ? (
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

  if (clickable && user.id) {
    return (
      <Link
        href={`/profile/${user.id}`}
        className="ring-offset-background focus-visible:ring-ring flex-shrink-0 rounded-full transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {avatar}
      </Link>
    )
  }

  return avatar
}

// ── useCommentAuthors ─────────────────────────────────────────────────────────

function useCommentAuthors(seedMap: Record<string, User>) {
  const [localMap, setLocalMap] = useState<Record<string, User>>(seedMap)
  const fetchedIds = useRef<Set<string>>(new Set(Object.keys(seedMap)))

  useEffect(() => {
    setLocalMap((prev) => {
      const merged = { ...prev }
      let changed = false
      for (const [id, u] of Object.entries(seedMap)) {
        if (!merged[id]) {
          merged[id] = u
          fetchedIds.current.add(id)
          changed = true
        }
      }
      return changed ? merged : prev
    })
  }, [seedMap])

  const resolveAuthors = useCallback(async (authorIds: string[]) => {
    const missing = [...new Set(authorIds)].filter((id) => !fetchedIds.current.has(id))
    if (missing.length === 0) return

    missing.forEach((id) => fetchedIds.current.add(id))

    const results = await Promise.allSettled(missing.map((id) => userApi.getById(id)))
    const updates: Record<string, User> = {}
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') updates[missing[i]] = r.value as User
    })
    if (Object.keys(updates).length > 0) {
      setLocalMap((prev) => ({ ...prev, ...updates }))
    }
  }, [])

  return { localMap, resolveAuthors }
}

// ── ReplyInput ────────────────────────────────────────────────────────────────

function ReplyInput({
  postId,
  parentCommentId,
  currentUserId,
  usersMap,
  onAdded,
  onCancel,
  depth,
}: {
  postId: string
  parentCommentId: string
  currentUserId: string
  usersMap: Record<string, User>
  onAdded: (reply: CommentResponse) => void
  onCancel: () => void
  depth: number
}) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || submitting) return
    setSubmitting(true)
    try {
      const reply = await commentApi.addComment(postId, {
        content: text.trim(),
        parentId: parentCommentId,
      })
      onAdded(reply)
      setText('')
    } catch (err) {
      console.error('Failed to post reply:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <UserAvatar user={usersMap[currentUserId]} size={depth >= 2 ? 'xs' : 'sm'} />
      <div className="flex flex-1 items-center gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply…"
          maxLength={2000}
          className="bg-muted text-foreground placeholder-muted-foreground focus:ring-primary/30 flex-1 rounded-full px-4 py-1.5 text-sm focus:ring-2 focus:outline-none dark:bg-slate-800"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || submitting}
          className="h-7 w-7 shrink-0"
        >
          <Send size={12} />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onCancel}
          className="h-7 w-7 shrink-0"
        >
          <X size={12} />
        </Button>
      </div>
    </form>
  )
}

// ── CommentRow (recursive) ────────────────────────────────────────────────────

interface CommentRowProps {
  comment: CommentResponse
  postId: string
  usersMap: Record<string, User>
  currentUserId: string
  currentUserRoles: string[]
  post: PostResponse
  onDeleted: (id: string) => void
  onUpdated: (updated: CommentResponse) => void
  resolveAuthors: (ids: string[]) => Promise<void>
  depth?: number
}

function CommentRow({
  comment,
  postId,
  usersMap,
  currentUserId,
  currentUserRoles,
  post,
  onDeleted,
  onUpdated,
  resolveAuthors,
  depth = 0,
}: CommentRowProps) {
  const author = usersMap[comment.authorId]
  const isOwn = comment.authorId === currentUserId

  const isTeamLeader = currentUserRoles.includes(ROLE.TEAM_LEADER)
  const isDeptLeader =
    currentUserRoles.includes(ROLE.DEPARTMENT_LEADER) ||
    currentUserRoles.includes('DEPARTMENT_MANAGER')
  const isCeo = currentUserRoles.includes(ROLE.CEO)

  const canEdit =
    isOwn ||
    isCeo ||
    (isTeamLeader && !!post.teamId) ||
    (isDeptLeader && (!!post.departmentId || !!post.teamId))

  // Reaction state
  const [likeCount, setLikeCount] = useState(comment.reactionCount)
  const [reactionCode, setReactionCode] = useState<ReactionCode | null>(null)
  const [showReactorsModal, setShowReactorsModal] = useState(false)

  useEffect(() => {
    reactionApi
      .getCommentReactions(postId, comment.id)
      .then((summary) => {
        setLikeCount(summary.total)
        setReactionCode((summary.userReaction?.reactionTypeCode as ReactionCode) ?? null)
      })
      .catch(() => {})
  }, [postId, comment.id])

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [saving, setSaving] = useState(false)

  // Reply state
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replies, setReplies] = useState<CommentResponse[]>([])
  const [replyCount, setReplyCount] = useState(comment.replyCount)
  const [showReplies, setShowReplies] = useState(false)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [repliesLoaded, setRepliesLoaded] = useState(false)

  // Limit visual indentation depth to avoid layout issues
  const avatarSize: 'sm' | 'xs' = depth >= 1 ? 'xs' : 'sm'
  const indentClass = depth >= 3 ? '' : '' // CSS handles the margin

  const loadReplies = useCallback(async () => {
    if (loadingReplies || repliesLoaded) return
    setLoadingReplies(true)
    try {
      const page = await commentApi.getReplies(postId, comment.id)
      setReplies(page.content)
      await resolveAuthors(page.content.map((r) => r.authorId))
      setRepliesLoaded(true)
    } catch (err) {
      console.error('Failed to load replies:', err)
    } finally {
      setLoadingReplies(false)
    }
  }, [postId, comment.id, loadingReplies, repliesLoaded, resolveAuthors])

  const toggleReplies = () => {
    if (!showReplies && !repliesLoaded) loadReplies()
    setShowReplies((s) => !s)
  }

  const handleReact = async (code: ReactionCode) => {
    try {
      const prev = reactionCode
      const res = await reactionApi.reactToComment(postId, comment.id, {
        reactionTypeCode: code,
      })
      if (res) {
        setReactionCode(code)
        if (!prev) setLikeCount((c) => c + 1)
      } else {
        setReactionCode(null)
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

  const handleEditSave = async () => {
    if (!editContent.trim() || saving) return
    setSaving(true)
    try {
      const updated = await commentApi.updateComment(postId, comment.id, {
        content: editContent.trim(),
      })
      onUpdated(updated)
      setIsEditing(false)
    } catch (e) {
      console.error('Failed to update comment:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleReplyAdded = async (reply: CommentResponse) => {
    setReplies((prev) => [...prev, reply])
    setReplyCount((c) => c + 1)
    setShowReplies(true)
    setRepliesLoaded(true)
    setShowReplyInput(false)
    await resolveAuthors([reply.authorId])
  }

  const handleReplyDeleted = (id: string) => {
    setReplies((prev) => prev.filter((r) => r.id !== id))
    setReplyCount((c) => Math.max(0, c - 1))
  }

  const handleReplyUpdated = (updated: CommentResponse) => {
    setReplies((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  }

  return (
    <div
      className={`flex gap-2 ${depth > 0 ? 'border-border ml-8 border-l pl-3 dark:border-slate-700' : ''}`}
    >
      <UserAvatar user={author} size={avatarSize} clickable />

      <div className="min-w-0 flex-1">
        {/* Bubble */}
        <div className="bg-muted rounded-2xl px-4 py-3 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-2">
            {author ? (
              <Link
                href={`/profile/${author.id}`}
                className="text-foreground truncate text-sm font-semibold hover:underline"
              >
                {getFullName(author)}
              </Link>
            ) : (
              <p className="text-foreground truncate text-sm font-semibold">Unknown user</p>
            )}
            {(isOwn || canEdit) && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil size={14} className="mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {isOwn && (
                    <>
                      {canEdit && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={handleDelete}
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={2000}
                rows={3}
                className="bg-background text-foreground placeholder-muted-foreground focus:ring-primary/30 w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:outline-none dark:bg-slate-700"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditContent(comment.content)
                    setIsEditing(false)
                  }}
                  className="h-7 px-2"
                >
                  <X size={14} className="mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleEditSave}
                  disabled={!editContent.trim() || saving}
                  className="h-7 px-3"
                >
                  <Check size={14} className="mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-foreground mt-1 text-sm leading-relaxed">{comment.content}</p>
          )}
        </div>

        {/* Action row */}
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 pl-3 text-xs">
          <span>{formatTime(comment.createdAt)}</span>

          <ReactionButton
            reactionCode={reactionCode}
            reactionCount={likeCount}
            onReact={handleReact}
            size="comment"
          />

          {likeCount > 0 && (
            <button
              onClick={() => setShowReactorsModal(true)}
              className="hover:text-primary -ml-2 transition-colors"
              title="See who reacted"
            >
              ({likeCount})
            </button>
          )}

          <UsersModal
            open={showReactorsModal}
            onOpenChange={setShowReactorsModal}
            title="Reactions"
            fetchUsers={async () => {
              const reactions = await reactionApi.getCommentReactors(postId, comment.id)
              return fetchReactors(reactions)
            }}
          />

          <button
            onClick={() => setShowReplyInput((s) => !s)}
            className="hover:text-primary flex items-center gap-1 font-medium transition-colors"
          >
            <CornerDownRight size={12} />
            Reply
          </button>

          {replyCount > 0 && (
            <button
              onClick={toggleReplies}
              className="hover:text-primary flex items-center gap-1 transition-colors"
            >
              {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showReplies ? 'Hide' : 'View'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}

          {comment.isEdited && <span className="italic">edited</span>}
        </div>

        {/* Reply input */}
        {showReplyInput && (
          <ReplyInput
            postId={postId}
            parentCommentId={comment.id}
            currentUserId={currentUserId}
            usersMap={usersMap}
            onAdded={handleReplyAdded}
            onCancel={() => setShowReplyInput(false)}
            depth={depth}
          />
        )}

        {/* Nested replies */}
        {showReplies && (
          <div className="mt-3 space-y-3">
            {loadingReplies ? (
              <div className="ml-8 flex gap-2">
                <div className="bg-muted h-6 w-6 animate-pulse rounded-full dark:bg-slate-700" />
                <div className="bg-muted h-12 flex-1 animate-pulse rounded-2xl dark:bg-slate-700" />
              </div>
            ) : (
              replies.map((reply) => (
                <CommentRow
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  usersMap={usersMap}
                  currentUserId={currentUserId}
                  currentUserRoles={currentUserRoles}
                  post={post}
                  onDeleted={handleReplyDeleted}
                  onUpdated={handleReplyUpdated}
                  resolveAuthors={resolveAuthors}
                  depth={depth + 1}
                />
              ))
            )}
          </div>
        )}
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
  onUpdate?: (updated: PostResponse) => void
}

export function PostCard({ post, currentUserId, usersMap, onDelete, onUpdate }: PostCardProps) {
  const { user: currentUser } = useAuth()

  const [reactionCount, setReactionCount] = useState(post.reactionCount)
  const [activeReaction, setActiveReaction] = useState<ReactionCode | null>(null)
  const [showReactorsModal, setShowReactorsModal] = useState(false)
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [showComments, setShowComments] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const [isEditingPost, setIsEditingPost] = useState(false)
  const [editPostContent, setEditPostContent] = useState(post.content)
  const [savingPost, setSavingPost] = useState(false)

  const currentUserRoles: string[] = currentUser?.roles ?? []
  const isOwn = post.authorId === currentUserId
  const isTeamLeader = currentUserRoles.includes(ROLE.TEAM_LEADER)
  const isDeptLeader =
    currentUserRoles.includes(ROLE.DEPARTMENT_LEADER) ||
    currentUserRoles.includes('DEPARTMENT_MANAGER')
  const isCeo = currentUserRoles.includes(ROLE.CEO)

  const canEditPost =
    isOwn ||
    isCeo ||
    (isTeamLeader && !!post.teamId) ||
    (isDeptLeader && (!!post.departmentId || !!post.teamId))

  const seedMap = currentUser ? { ...usersMap, [currentUser.id]: currentUser } : usersMap
  const { localMap: commentUsersMap, resolveAuthors } = useCommentAuthors(seedMap)

  const author = commentUsersMap[post.authorId]

  useEffect(() => {
    reactionApi
      .getPostReactions(post.id)
      .then((summary) => {
        setReactionCount(summary.total)
        setActiveReaction((summary.userReaction?.reactionTypeCode as ReactionCode) ?? null)
      })
      .catch(() => {})
  }, [post.id])

  const loadComments = useCallback(async () => {
    if (loadingComments) return
    setLoadingComments(true)
    try {
      const page = await commentApi.getComments(post.id)
      setComments(page.content)
      await resolveAuthors(page.content.map((c) => c.authorId))
    } catch (e) {
      console.error('Failed to load comments:', e)
    } finally {
      setLoadingComments(false)
    }
  }, [post.id, loadingComments, resolveAuthors])

  const toggleComments = () => {
    if (!showComments && comments.length === 0) loadComments()
    setShowComments((s) => !s)
  }

  const handleReact = async (code: ReactionCode) => {
    try {
      const prev = activeReaction
      const res = await reactionApi.reactToPost(post.id, { reactionTypeCode: code })
      if (res) {
        setActiveReaction(code)
        if (!prev) setReactionCount((c) => c + 1)
      } else {
        setActiveReaction(null)
        setReactionCount((c) => Math.max(0, c - 1))
      }
    } catch (e) {
      console.error('Failed to react to post:', e)
    }
  }

  const handleDelete = async () => {
    try {
      await postApi.delete(post.id)
      onDelete?.(post.id)
    } catch (e) {
      console.error('Failed to delete post:', e)
    }
  }

  const handleEditPostSave = async () => {
    if (!editPostContent.trim() || savingPost) return
    setSavingPost(true)
    try {
      const updated = await postApi.update(post.id, {
        content: editPostContent.trim(),
        postType: post.postType,
        postVisibility: post.postVisibility as 'PUBLIC' | 'PRIVATE',
        teamId: post.teamId ?? undefined,
        departmentId: post.departmentId ?? undefined,
        isPinned: post.isPinned,
        isAIGenerated: post.isAIGenerated,
      })
      onUpdate?.(updated)
      setIsEditingPost(false)
    } catch (e) {
      console.error('Failed to update post:', e)
    } finally {
      setSavingPost(false)
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
      await resolveAuthors([comment.authorId])
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

  const handleCommentUpdated = (updated: CommentResponse) => {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const typeStyle = POST_TYPE_STYLES[post.postType] ?? POST_TYPE_STYLES.DISCUSSION

  return (
    <div className="border-border animate-slide-up bg-background rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-4 flex items-start gap-4">
        <UserAvatar user={author} clickable />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {author ? (
                <Link
                  href={`/profile/${author.id}`}
                  className="text-foreground font-semibold hover:underline"
                >
                  {getFullName(author)}
                </Link>
              ) : (
                <p className="text-foreground font-semibold">Unknown user</p>
              )}
              {post.isPinned && <Pin size={12} className="text-primary shrink-0" />}
              <Badge className={`${typeStyle.color} border-0 text-xs`}>{typeStyle.label}</Badge>
            </div>
            {author?.jobTitle && (
              <p className="text-muted-foreground truncate text-sm">{author.jobTitle}</p>
            )}
            <p className="text-muted-foreground text-xs">{formatTime(post.createdAt)}</p>
          </div>

          {(canEditPost || isOwn) && !isEditingPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEditPost && (
                  <DropdownMenuItem onClick={() => setIsEditingPost(true)}>
                    <Pencil size={14} className="mr-2" />
                    Edit post
                  </DropdownMenuItem>
                )}
                {isOwn && (
                  <>
                    {canEditPost && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditingPost ? (
        <div className="mb-4 space-y-2">
          <textarea
            value={editPostContent}
            onChange={(e) => setEditPostContent(e.target.value)}
            maxLength={5000}
            rows={5}
            className="bg-muted text-foreground placeholder-muted-foreground focus:ring-primary/30 w-full rounded-xl px-4 py-3 text-sm leading-relaxed focus:ring-2 focus:outline-none dark:bg-slate-800"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditPostContent(post.content)
                setIsEditingPost(false)
              }}
            >
              <X size={14} className="mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEditPostSave}
              disabled={!editPostContent.trim() || savingPost}
            >
              <Check size={14} className="mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-foreground mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Stats bar */}
      <div className="text-muted-foreground border-border flex items-center gap-6 border-t border-b py-2.5 text-sm dark:border-slate-700">
        <button
          onClick={() => reactionCount > 0 && setShowReactorsModal(true)}
          className={
            reactionCount > 0 ? 'hover:text-foreground transition-colors' : 'cursor-default'
          }
        >
          {reactionCount} {reactionCount === 1 ? 'reaction' : 'reactions'}
        </button>
        <button onClick={toggleComments} className="hover:text-foreground transition-colors">
          {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      <UsersModal
        open={showReactorsModal}
        onOpenChange={setShowReactorsModal}
        title="Reactions"
        fetchUsers={async () => {
          const reactions = await reactionApi.getPostReactors(post.id)
          return fetchReactors(reactions)
        }}
      />

      {/* Action buttons */}
      <div className="my-3 flex items-center gap-1">
        <ReactionButton
          reactionCode={activeReaction}
          reactionCount={reactionCount}
          onReact={handleReact}
          size="post"
        />
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
          {/* Add top-level comment */}
          <form onSubmit={handleAddComment} className="mb-4 flex items-center gap-3">
            <UserAvatar user={commentUsersMap[currentUserId]} size="sm" />
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
                  postId={post.id}
                  usersMap={commentUsersMap}
                  currentUserId={currentUserId}
                  currentUserRoles={currentUserRoles}
                  post={post}
                  onDeleted={handleCommentDeleted}
                  onUpdated={handleCommentUpdated}
                  resolveAuthors={resolveAuthors}
                  depth={0}
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
