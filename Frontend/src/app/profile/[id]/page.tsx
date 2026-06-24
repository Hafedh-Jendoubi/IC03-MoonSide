'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Mail,
  MessageSquare,
  MapPin,
  Pencil,
  Phone,
  Briefcase,
  Calendar,
  X,
  Save,
  Loader2,
  Camera,
  Trash2,
  FileText,
  Heart,
  MessageCircle,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { User, getFullName } from '@/lib/types'
import {
  userApi,
  mediaApi,
  UpdateUserRequest,
  postApi,
  reactionApi,
  commentApi,
  PostResponse,
  ReactionResponse,
} from '@/lib/api'
import { PostViewModal } from '@/components/post-view-modal'
import { ContactOptionsModal } from '@/components/contact-options-modal'

// --- Edit Profile Modal -------------------------------------------------------

interface EditProfileModalProps {
  user: User
  onClose: () => void
  onSaved: (updated: User) => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_MB = 10

function EditProfileModal({ user, onClose, onSaved }: EditProfileModalProps) {
  const { refreshUser } = useAuth()

  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    jobTitle: user.jobTitle ?? '',
    phoneNumber: user.phoneNumber ?? '',
    bio: user.bio ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // Save profile fields — use the /users/me endpoint (requires USER_UPDATE_OWN)
      const payload: UpdateUserRequest = {
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        jobTitle: form.jobTitle || undefined,
        phoneNumber: form.phoneNumber || undefined,
        bio: form.bio || undefined,
      }
      const updated = await userApi.updateMe(payload)
      await refreshUser()
      onSaved(updated as unknown as User)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="animate-scale-in flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        style={{ maxHeight: 'calc(100vh - 3rem)' }}
      >
        {/* Modal header */}
        <div className="border-border flex flex-shrink-0 items-center justify-between border-b px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-foreground text-lg font-semibold">Edit Profile</h2>
            <p className="text-muted-foreground text-sm">Update your personal information</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-4 px-6 py-5">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">First Name</label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">Last Name</label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Job Title</label>
              <Input
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                placeholder="e.g. Software Engineer"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Phone Number</label>
              <Input
                value={form.phoneNumber}
                onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                type="tel"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell people a bit about yourself..."
                rows={3}
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1 pb-1">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 gap-2 text-white"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
          {/* end space-y-4 */}
        </form>
      </div>
    </div>
  )
}

// --- Activity Types -----------------------------------------------------------

type ActivityKind = 'POST' | 'COMMENT' | 'REACTION'

interface ActivityItem {
  id: string
  kind: ActivityKind
  timestamp: string
  // POST
  post?: PostResponse
  // COMMENT
  commentContent?: string
  commentPostId?: string
  commentPostContent?: string
  // REACTION
  reactionEmoji?: string
  reactionPostId?: string
  reactionPostContent?: string
}

// --- Recent Activity Section --------------------------------------------------

const ACTIVITY_PAGE_SIZE = 5
const POST_FETCH_LIMIT = 10 // posts to scan for reactions/comments

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function truncate(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

const ACTIVITY_ICON: Record<ActivityKind, { icon: React.ReactNode; label: string; color: string }> =
  {
    POST: {
      icon: <FileText size={14} />,
      label: 'Published a post',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    },
    COMMENT: {
      icon: <MessageCircle size={14} />,
      label: 'Commented on a post',
      color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    },
    REACTION: {
      icon: <Heart size={14} />,
      label: 'Reacted to a post',
      color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
    },
  }

interface RecentActivityProps {
  userId: string
  onOpenPost: (postId: string) => void
}

function RecentActivity({ userId, onOpenPost }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(ACTIVITY_PAGE_SIZE)

  useEffect(() => {
    let cancelled = false

    async function fetchActivity() {
      setLoading(true)
      setError(null)

      try {
        // 1. Fetch user's own posts (most recent first)
        const postsPage = await postApi.getByAuthor(userId, 0, POST_FETCH_LIMIT)
        const userPosts: PostResponse[] = postsPage.content ?? []

        if (cancelled) return

        // 2. Build POST activities
        const postActivities: ActivityItem[] = userPosts.map((p) => ({
          id: `post-${p.id}`,
          kind: 'POST' as ActivityKind,
          timestamp: p.createdAt,
          post: p,
        }))

        // 3. Fetch comments & reactions on each post in parallel (limited set)
        const postsToScan = userPosts.slice(0, POST_FETCH_LIMIT)

        const [commentsResults, reactionsResults] = await Promise.all([
          // Comments on each post — filter to those authored by this user
          Promise.allSettled(
            postsToScan.map((p) =>
              commentApi.getComments(p.id, 0, 50).then((page) => ({
                postId: p.id,
                postContent: p.content,
                comments: (page.content ?? []).filter((c) => c.authorId === userId),
              }))
            )
          ),
          // Reactions on each post — filter to those by this user
          Promise.allSettled(
            postsToScan.map((p) =>
              reactionApi.getPostReactors(p.id).then((reactors: ReactionResponse[]) => ({
                postId: p.id,
                postContent: p.content,
                reactions: reactors.filter((r) => r.userId === userId),
              }))
            )
          ),
        ])

        if (cancelled) return

        // 4. Build COMMENT activities
        const commentActivities: ActivityItem[] = []
        for (const result of commentsResults) {
          if (result.status === 'fulfilled') {
            for (const c of result.value.comments) {
              commentActivities.push({
                id: `comment-${c.id}`,
                kind: 'COMMENT',
                timestamp: c.createdAt,
                commentContent: c.content,
                commentPostId: result.value.postId,
                commentPostContent: result.value.postContent,
              })
            }
          }
        }

        // 5. Build REACTION activities
        const reactionActivities: ActivityItem[] = []
        for (const result of reactionsResults) {
          if (result.status === 'fulfilled') {
            for (const r of result.value.reactions) {
              reactionActivities.push({
                id: `reaction-${r.id}`,
                kind: 'REACTION',
                timestamp: r.createdAt,
                reactionEmoji: r.reactionTypeEmoji,
                reactionPostId: result.value.postId,
                reactionPostContent: result.value.postContent,
              })
            }
          }
        }

        // 6. Merge and sort by newest first
        const all = [...postActivities, ...commentActivities, ...reactionActivities].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )

        if (!cancelled) {
          setActivities(all)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load activity')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchActivity()
    return () => {
      cancelled = true
    }
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
        {error}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
          <Activity className="text-muted-foreground h-5 w-5" />
        </div>
        <p className="text-muted-foreground text-sm">No recent activity yet</p>
      </div>
    )
  }

  const visible = activities.slice(0, visibleCount)
  const hasMore = visibleCount < activities.length

  return (
    <div className="space-y-1">
      {/* Stats bar */}
      <div className="mb-5 flex flex-wrap gap-4">
        {(
          [
            { kind: 'POST', label: 'Posts', icon: <FileText size={13} /> },
            { kind: 'COMMENT', label: 'Comments', icon: <MessageCircle size={13} /> },
            { kind: 'REACTION', label: 'Reactions', icon: <Heart size={13} /> },
          ] as const
        ).map(({ kind, label, icon }) => {
          const count = activities.filter((a) => a.kind === kind).length
          const meta = ACTIVITY_ICON[kind]
          return (
            <div
              key={kind}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.color}`}
            >
              {icon}
              <span>
                {count} {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="bg-border absolute top-0 bottom-0 left-[19px] w-px" />

        <div className="space-y-4">
          {visible.map((item) => {
            const meta = ACTIVITY_ICON[item.kind]
            return (
              <div key={item.id} className="flex gap-4">
                {/* Icon bubble */}
                <div
                  className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${meta.color}`}
                >
                  {item.kind === 'REACTION' && item.reactionEmoji ? (
                    <span className="text-base">{item.reactionEmoji}</span>
                  ) : (
                    meta.icon
                  )}
                </div>

                {/* Content */}
                <div
                  className="bg-card border-border hover:bg-muted/30 min-w-0 flex-1 cursor-pointer rounded-xl border p-3 transition-colors"
                  onClick={() => {
                    const postId = item.post?.id ?? item.commentPostId ?? item.reactionPostId
                    if (postId) onOpenPost(postId)
                  }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-foreground text-sm font-medium">{meta.label}</span>
                    <span className="text-muted-foreground flex-shrink-0 text-xs">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>

                  {item.kind === 'POST' && item.post && (
                    <button
                      onClick={() => onOpenPost(item.post!.id)}
                      className="text-muted-foreground hover:text-primary block w-full text-left text-sm transition-colors"
                    >
                      <span className="italic">"{truncate(item.post.content)}"</span>
                      {(item.post.commentCount > 0 || item.post.reactionCount > 0) && (
                        <span className="text-muted-foreground/70 ml-2 text-xs">
                          · {item.post.commentCount} comment
                          {item.post.commentCount !== 1 ? 's' : ''}· {item.post.reactionCount}{' '}
                          reaction{item.post.reactionCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </button>
                  )}

                  {item.kind === 'COMMENT' && item.commentPostId && (
                    <button
                      onClick={() => onOpenPost(item.commentPostId!)}
                      className="text-muted-foreground hover:text-primary block w-full text-left text-sm transition-colors"
                    >
                      <span className="italic">"{truncate(item.commentContent ?? '')}"</span>
                      {item.commentPostContent && (
                        <span className="text-muted-foreground/70 ml-1 text-xs">
                          on "{truncate(item.commentPostContent, 50)}"
                        </span>
                      )}
                    </button>
                  )}

                  {item.kind === 'REACTION' && item.reactionPostId && (
                    <button
                      onClick={() => onOpenPost(item.reactionPostId!)}
                      className="text-muted-foreground hover:text-primary block w-full text-left text-sm transition-colors"
                    >
                      {item.reactionEmoji && <span className="mr-1">{item.reactionEmoji}</span>}
                      {item.reactionPostContent && (
                        <span>on "{truncate(item.reactionPostContent, 60)}"</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Load more / collapse */}
      {(hasMore || visibleCount > ACTIVITY_PAGE_SIZE) && (
        <div className="pt-3 text-center">
          {hasMore ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setVisibleCount((v) => v + ACTIVITY_PAGE_SIZE)}
            >
              <ChevronDown size={14} />
              Show more ({activities.length - visibleCount} remaining)
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setVisibleCount(ACTIVITY_PAGE_SIZE)}
            >
              <ChevronUp size={14} />
              Show less
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// --- Profile Page -------------------------------------------------------------

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const userId = params.id as string

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewPostId, setViewPostId] = useState<string | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)

  // Avatar editing state (own profile only)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarStatus, setAvatarStatus] = useState<'idle' | 'uploading' | 'deleting'>('idle')
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profileUser) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError('Only JPEG, PNG, GIF and WebP images are allowed.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setAvatarError(`File must be under ${MAX_SIZE_MB} MB.`)
      return
    }
    setAvatarError(null)
    setAvatarStatus('uploading')
    try {
      const media = await mediaApi.upload(file, 'AVATAR')
      await userApi.updateAvatar(media.url)
      setProfileUser((u) => (u ? { ...u, avatar: media.url } : u))
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setAvatarStatus('idle')
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleDeleteAvatar = async () => {
    if (!profileUser) return
    setAvatarError(null)
    setAvatarStatus('deleting')
    try {
      await userApi.deleteAvatar()
      setProfileUser((u) => (u ? { ...u, avatar: null } : u))
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to remove photo')
    } finally {
      setAvatarStatus('idle')
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const data = await userApi.getById(userId)
        setProfileUser(data as unknown as User)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'User not found')
      } finally {
        setIsLoading(false)
      }
    }
    if (userId) fetchUser()
  }, [userId])

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2"></div>
        </div>
      </AuthLayout>
    )
  }

  if (error || !profileUser) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 text-center">
          <h1 className="text-foreground text-2xl font-bold">User not found</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </AuthLayout>
    )
  }

  const isOwnProfile = currentUser?.id === profileUser.id
  const displayName = getFullName(profileUser)

  return (
    <AuthLayout>
      {/* Post View Modal */}
      {viewPostId && <PostViewModal postId={viewPostId} onClose={() => setViewPostId(null)} />}

      {/* Contact Options Modal — choose Outlook email or Teams chat */}
      {profileUser.email && (
        <ContactOptionsModal
          open={showContactModal}
          onOpenChange={setShowContactModal}
          recipientName={displayName}
          recipientEmail={profileUser.email}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditModal && isOwnProfile && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setProfileUser(updated)
            setShowEditModal(false)
          }}
        />
      )}

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cover Image */}
        <div className="animate-fade-in from-primary/20 to-secondary/20 mb-6 h-48 rounded-xl bg-gradient-to-r"></div>

        {/* Profile Card */}
        <Card className="animate-scale-in relative -mt-24 mb-8 p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Avatar with hover controls (own profile only) */}
            <div className="relative flex-shrink-0 self-start">
              <div className="group relative h-32 w-32">
                {profileUser.avatar ? (
                  <img
                    src={profileUser.avatar}
                    alt={displayName}
                    className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg dark:border-slate-800"
                  />
                ) : (
                  <div className="bg-primary/10 text-primary flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full border-4 border-white text-4xl font-bold shadow-lg dark:border-slate-800">
                    {profileUser.firstName?.[0]?.toUpperCase()}
                    {profileUser.lastName?.[0]?.toUpperCase()}
                  </div>
                )}

                {/* Hover overlay — own profile only */}
                {isOwnProfile && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    {avatarStatus !== 'idle' ? (
                      <Loader2 size={22} className="animate-spin text-white" />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          title="Change photo"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/40"
                        >
                          <Pencil size={15} />
                        </button>
                        {profileUser.avatar && (
                          <button
                            type="button"
                            onClick={handleDeleteAvatar}
                            title="Remove photo"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/80 text-white transition-colors hover:bg-red-600"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              {isOwnProfile && (
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept={ALLOWED_TYPES.join(',')}
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              )}

              {/* Avatar error */}
              {avatarError && (
                <p className="mt-1 max-w-[8rem] text-center text-xs text-red-500">{avatarError}</p>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-foreground text-3xl font-bold">{displayName}</h1>
                  {profileUser.jobTitle && (
                    <p className="text-primary text-lg font-medium">{profileUser.jobTitle}</p>
                  )}
                  <p className="text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin size={16} />
                    {profileUser.active ? 'Active Member' : 'Inactive'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Pencil size={16} />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setShowContactModal(true)}
                        disabled={!profileUser.email}
                        title={profileUser.email ? `Message ${displayName}` : 'No email on file'}
                      >
                        <Mail size={18} />
                        Message
                      </Button>
                      <Button className="bg-primary hover:bg-primary/90 gap-2 text-white">
                        <MessageSquare size={18} />
                        Connect
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {profileUser.bio && (
                <p className="text-foreground mb-4 leading-relaxed">{profileUser.bio}</p>
              )}
            </div>
          </div>
        </Card>

        {/* About Section */}
        <Card className="animate-slide-up mb-8 p-6">
          <h2 className="text-foreground mb-4 text-2xl font-bold">About</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                <Mail className="text-primary h-4 w-4" />
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                  Email
                </p>
                <p className="text-foreground font-medium">{profileUser.email}</p>
              </div>
            </div>

            {profileUser.jobTitle && (
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                  <Briefcase className="text-primary h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                    Job Title
                  </p>
                  <p className="text-foreground font-medium">{profileUser.jobTitle}</p>
                </div>
              </div>
            )}

            {profileUser.phoneNumber && (
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                  <Phone className="text-primary h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                    Phone
                  </p>
                  <p className="text-foreground font-medium">{profileUser.phoneNumber}</p>
                </div>
              </div>
            )}

            {profileUser.birthDate && (
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                  <Calendar className="text-primary h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                    Birthday
                  </p>
                  <p className="text-foreground font-medium">
                    {new Date(profileUser.birthDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                <Calendar className="text-primary h-4 w-4" />
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                  Member Since
                </p>
                <p className="text-foreground font-medium">
                  {new Date(profileUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {profileUser.bio && (
              <div className="flex items-start gap-3 md:col-span-2">
                <div>
                  <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                    Bio
                  </p>
                  <p className="text-foreground">{profileUser.bio}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="animate-slide-up p-6" style={{ animationDelay: '100ms' }}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-foreground text-2xl font-bold">Recent Activity</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Posts, comments, and reactions by {isOwnProfile ? 'you' : getFullName(profileUser)}
              </p>
            </div>
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <Activity className="text-primary h-5 w-5" />
            </div>
          </div>
          <RecentActivity userId={userId} onOpenPost={(id) => setViewPostId(id)} />
        </Card>
      </div>
    </AuthLayout>
  )
}
