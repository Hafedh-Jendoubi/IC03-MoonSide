'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Users, Pencil, X, UserMinus } from 'lucide-react'
import { teamApi, departmentApi, TeamResponse, UserTeamResponse } from '@/lib/api'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { OrgAvatarUpload, OrgBannerUpload } from '@/components/org-image-upload'
import { useAuth } from '@/lib/auth-context'
import { Post, User, hasRole } from '@/lib/types'

// ── helpers ───────────────────────────────────────────────────────────────────

function canEditTeam(
  user: User | null,
  team: TeamResponse | null,
  userManagedDeptIds: string[]
): boolean {
  if (!user || !team) return false
  if (hasRole(user, 'CEO')) return true
  if (hasRole(user, 'TEAM_LEADER') && team.leadId === user.id) return true
  if (hasRole(user, 'DEPARTMENT_LEADER') && userManagedDeptIds.includes(team.departmentId))
    return true
  return false
}

// ── Team Members Modal ────────────────────────────────────────────────────────

interface TeamMembersModalProps {
  team: TeamResponse
  canKick: boolean
  onClose: () => void
  onMemberKicked: () => void
}

function TeamMembersModal({ team, canKick, onClose, onMemberKicked }: TeamMembersModalProps) {
  const [members, setMembers] = useState<UserTeamResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kickingId, setKickingId] = useState<string | null>(null)
  const [confirmKick, setConfirmKick] = useState<UserTeamResponse | null>(null)

  useEffect(() => {
    setLoading(true)
    teamApi
      .getMembers(team.id)
      .then(setMembers)
      .catch((e: any) => setError(e.message ?? 'Failed to load members'))
      .finally(() => setLoading(false))
  }, [team.id])

  const handleKick = async (member: UserTeamResponse) => {
    setConfirmKick(null)
    setKickingId(member.userId)
    try {
      await teamApi.removeMember(team.id, member.userId)
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId))
      onMemberKicked()
    } catch (e: any) {
      setError(e.message ?? 'Failed to remove member')
    } finally {
      setKickingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background w-full max-w-md rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-5 w-5" />
            <h2 className="text-foreground text-lg font-semibold">
              Members
              <span className="text-muted-foreground ml-2 text-base font-normal">
                ({members.length})
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && members.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">No members yet.</p>
          )}

          {!loading && members.length > 0 && (
            <ul className="space-y-1">
              {members.map((member) => {
                const u = member.user
                const isLead = member.userId === team.leadId
                const isKicking = kickingId === member.userId
                return (
                  <li
                    key={member.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-muted h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border">
                        {u?.avatar ? (
                          <img
                            src={u.avatar}
                            alt={`${u.firstName} ${u.lastName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-muted-foreground text-xs font-semibold">
                              {u?.firstName?.[0]?.toUpperCase() ?? '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground text-sm leading-tight font-medium">
                          {u ? `${u.firstName} ${u.lastName}` : 'Unknown User'}
                          {isLead && (
                            <span className="bg-primary/10 text-primary ml-2 rounded px-1.5 py-0.5 text-xs font-semibold">
                              Leader
                            </span>
                          )}
                        </p>
                        {u?.jobTitle && (
                          <p className="text-muted-foreground truncate text-xs">{u.jobTitle}</p>
                        )}
                      </div>
                    </div>

                    {canKick && !isLead && (
                      <button
                        onClick={() => setConfirmKick(member)}
                        disabled={isKicking}
                        title="Remove from team"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2 flex-shrink-0 rounded-lg p-1.5 transition-colors disabled:opacity-50"
                      >
                        {isKicking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t px-6 py-4">
          <button
            onClick={onClose}
            className="border-border text-foreground rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>

      {/* Kick confirm dialog */}
      {confirmKick && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background w-full max-w-sm rounded-xl p-6 shadow-xl">
            <h3 className="text-foreground mb-2 text-base font-semibold">Remove Member</h3>
            <p className="text-muted-foreground mb-5 text-sm">
              Are you sure you want to remove{' '}
              <span className="text-foreground font-medium">
                {confirmKick.user
                  ? `${confirmKick.user.firstName} ${confirmKick.user.lastName}`
                  : 'this member'}
              </span>{' '}
              from <span className="text-foreground font-medium">{team.name}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmKick(null)}
                className="border-border text-foreground rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleKick(confirmKick)}
                className="bg-destructive text-destructive-foreground rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

interface EditTeamModalProps {
  team: TeamResponse
  onClose: () => void
  onSaved: (updated: TeamResponse) => void
}

function EditTeamModal({ team, onClose, onSaved }: EditTeamModalProps) {
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description ?? '')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(
    team.teamVisibility as 'PUBLIC' | 'PRIVATE'
  )
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null | undefined>(undefined)
  const [pendingBannerUrl, setPendingBannerUrl] = useState<string | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayAvatar = pendingAvatarUrl !== undefined ? pendingAvatarUrl : team.avatarUrl
  const displayBanner = pendingBannerUrl !== undefined ? pendingBannerUrl : team.bannerUrl

  const handleSave = async () => {
    if (!name.trim()) return
    try {
      setSaving(true)
      setError(null)

      let result = await teamApi.update(team.id, {
        name: name.trim(),
        description: description.trim(),
        departmentId: team.departmentId,
        leadId: team.leadId ?? undefined,
        teamVisibility: visibility,
      })

      if (pendingAvatarUrl !== undefined) {
        result = await teamApi.updateAvatar(team.id, pendingAvatarUrl)
      }
      if (pendingBannerUrl !== undefined) {
        result = await teamApi.updateBanner(team.id, pendingBannerUrl)
      }

      onSaved(result)
    } catch (e: any) {
      setError(e.message ?? 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background w-full max-w-lg rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-foreground text-lg font-semibold">Edit Team</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Banner */}
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Banner Image</label>
            <OrgBannerUpload
              currentUrl={displayBanner}
              onUploaded={setPendingBannerUrl}
              context="TEAM_BANNER"
              disabled={saving}
            />
          </div>

          {/* Avatar + Name row */}
          <div className="flex items-end gap-4">
            <div className="flex-shrink-0">
              <label className="text-foreground mb-2 block text-sm font-medium">Avatar</label>
              <OrgAvatarUpload
                currentUrl={displayAvatar}
                onUploaded={setPendingAvatarUrl}
                context="TEAM_AVATAR"
                label="Change team avatar"
                disabled={saving}
              />
            </div>
            <div className="flex-1">
              <label className="text-foreground mb-1 block text-sm font-medium">Team Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={saving}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              disabled={saving}
              className="border-border bg-background text-foreground w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
              disabled={saving}
              className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
            >
              <option value="PUBLIC">Public — anyone can join</option>
              <option value="PRIVATE">Private — invite only</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="border-border text-foreground rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamFeedPage() {
  const params = useParams()
  const { user } = useAuth()
  const teamId = params?.id as string

  const [team, setTeam] = useState<TeamResponse | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [usersMap] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userManagedDeptIds, setUserManagedDeptIds] = useState<string[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)

  useEffect(() => {
    if (!teamId) return
    const loadData = async () => {
      try {
        setLoading(true)
        const teamData = await teamApi.getById(teamId)
        setTeam(teamData)
        const stored = localStorage.getItem(`team_posts_${teamId}`)
        if (stored) {
          try {
            setPosts(JSON.parse(stored))
          } catch {
            /* ignore */
          }
        }
      } catch (e: any) {
        setError(e.message ?? 'Failed to load team')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [teamId])

  // Fetch departments this user manages (for DEPARTMENT_LEADER role check)
  useEffect(() => {
    if (!user || (!hasRole(user, 'DEPARTMENT_LEADER') && !hasRole(user, 'CEO'))) return
    departmentApi
      .getAll()
      .then((depts) =>
        setUserManagedDeptIds(depts.filter((d) => d.managerId === user.id).map((d) => d.id))
      )
      .catch(() => {})
  }, [user])

  const handlePostCreate = (content: string) => {
    if (!user) return
    const newPost: Post = {
      id: Date.now().toString(),
      authorId: user.id,
      content,
      timestamp: new Date(),
      likes: [],
      comments: [],
    }
    const updated = [newPost, ...posts]
    setPosts(updated)
    localStorage.setItem(`team_posts_${teamId}`, JSON.stringify(updated))
  }

  const handleLike = (postId: string) => {
    if (!user) return
    const updated = posts.map((post) => {
      if (post.id !== postId) return post
      const hasLiked = post.likes.includes(user.id)
      return {
        ...post,
        likes: hasLiked ? post.likes.filter((id) => id !== user.id) : [...post.likes, user.id],
      }
    })
    setPosts(updated)
    localStorage.setItem(`team_posts_${teamId}`, JSON.stringify(updated))
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="text-primary h-12 w-12 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (error || !team) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 text-center">
          <h1 className="text-foreground text-2xl font-bold">Team not found</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </AuthLayout>
    )
  }

  if (!user) return null

  const showEditButton = canEditTeam(user, team, userManagedDeptIds)

  return (
    <AuthLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cover Banner */}
        <div className="from-primary/20 to-secondary/20 relative mb-0 h-48 overflow-hidden rounded-xl bg-gradient-to-r">
          {team.bannerUrl ? (
            <img src={team.bannerUrl} alt={team.name} className="h-full w-full object-cover" />
          ) : (
            <div className="from-primary/20 to-secondary/20 h-full w-full bg-gradient-to-r" />
          )}
        </div>

        {/* Team Header — avatar overlaps banner */}
        <div className="bg-background mb-8 flex items-end gap-6 px-2">
          {/* Team Avatar */}
          <div className="relative -mt-14 flex-shrink-0">
            <div className="bg-muted flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-lg dark:border-slate-800">
              {team.avatarUrl ? (
                <img src={team.avatarUrl} alt={team.name} className="h-full w-full object-cover" />
              ) : (
                <Users className="text-foreground h-14 w-14" />
              )}
            </div>
          </div>

          {/* Team Info */}
          <div className="flex flex-1 items-end justify-between pt-4 pb-2">
            <div>
              <h1 className="text-foreground text-3xl font-bold">{team.name}</h1>
              {team.description && (
                <p className="text-muted-foreground mt-1 text-sm">{team.description}</p>
              )}
              {team.lead && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Led by {team.lead.firstName} {team.lead.lastName}
                </p>
              )}
              {/* Clickable member count */}
              <button
                onClick={() => setMembersOpen(true)}
                className="text-muted-foreground hover:text-primary mt-1 flex items-center gap-1.5 text-xs transition-colors hover:underline"
                title="View members"
              >
                <Users className="h-3.5 w-3.5" />
                {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
              </button>
            </div>

            {showEditButton && (
              <button
                onClick={() => setEditOpen(true)}
                className="border-border text-foreground hover:bg-muted flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Edit Team
              </button>
            )}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          <CreatePost user={user} onPostCreate={handlePostCreate} />

          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mb-4 text-6xl">📝</div>
                <h2 className="text-foreground mb-2 text-xl font-semibold">No posts yet</h2>
                <p className="text-muted-foreground">
                  Be the first to share something with your team!
                </p>
              </div>
            ) : (
              posts.map((post, index) => (
                <div key={post.id} style={{ animation: `slide-up 0.3s ease-out ${index * 50}ms` }}>
                  <PostCard
                    post={post}
                    currentUserId={user.id}
                    onLike={handleLike}
                    usersMap={usersMap}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {editOpen && (
        <EditTeamModal
          team={team}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setTeam(updated)
            setEditOpen(false)
          }}
        />
      )}

      {membersOpen && (
        <TeamMembersModal
          team={team}
          canKick={showEditButton}
          onClose={() => setMembersOpen(false)}
          onMemberKicked={() =>
            setTeam((prev) =>
              prev ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) } : prev
            )
          }
        />
      )}
    </AuthLayout>
  )
}
