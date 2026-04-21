'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Building2, Pencil, X } from 'lucide-react'
import { departmentApi, teamApi, DepartmentResponse, TeamResponse } from '@/lib/api'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { OrgAvatarUpload, OrgBannerUpload } from '@/components/org-image-upload'
import { useAuth } from '@/lib/auth-context'
import { Post, User, hasRole } from '@/lib/types'
import Link from 'next/link'

// ── helpers ──────────────────────────────────────────────────────────────────

function canEditDepartment(user: User | null, department: DepartmentResponse | null): boolean {
  if (!user || !department) return false
  if (hasRole(user, 'CEO')) return true
  if (hasRole(user, 'DEPARTMENT_LEADER') && department.managerId === user.id) return true
  return false
}

function canEditTeam(
  user: User | null,
  team: TeamResponse,
  department: DepartmentResponse | null
): boolean {
  if (!user) return false
  if (hasRole(user, 'CEO')) return true
  if (hasRole(user, 'TEAM_LEADER') && team.leadId === user.id) return true
  if (hasRole(user, 'DEPARTMENT_LEADER') && department?.managerId === user.id) return true
  return false
}

// ── Edit Department Modal ─────────────────────────────────────────────────────

interface EditDepartmentModalProps {
  department: DepartmentResponse
  canEdit: boolean
  onClose: () => void
  onSaved: (updated: DepartmentResponse) => void
}

function EditDepartmentModal({ department, canEdit, onClose, onSaved }: EditDepartmentModalProps) {
  const [name, setName] = useState(department.name)
  const [description, setDescription] = useState(department.description ?? '')
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null | undefined>(undefined)
  const [pendingBannerUrl, setPendingBannerUrl] = useState<string | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayAvatar = pendingAvatarUrl !== undefined ? pendingAvatarUrl : department.avatarUrl
  const displayBanner = pendingBannerUrl !== undefined ? pendingBannerUrl : department.bannerUrl

  const handleSave = async () => {
    if (!name.trim()) return
    try {
      setSaving(true)
      setError(null)
      let result = await departmentApi.update(department.id, {
        name: name.trim(),
        description: description.trim(),
      })
      if (pendingAvatarUrl !== undefined) {
        result = await departmentApi.updateAvatar(department.id, pendingAvatarUrl)
      }
      if (pendingBannerUrl !== undefined) {
        result = await departmentApi.updateBanner(department.id, pendingBannerUrl)
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
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-foreground text-lg font-semibold">Edit Department</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Banner Image</label>
            <OrgBannerUpload
              currentUrl={displayBanner}
              onUploaded={setPendingBannerUrl}
              context="DEPT_BANNER"
              disabled={saving || !canEdit}
            />
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-shrink-0">
              <label className="text-foreground mb-2 block text-sm font-medium">Avatar</label>
              <OrgAvatarUpload
                currentUrl={displayAvatar}
                onUploaded={setPendingAvatarUrl}
                context="DEPT_AVATAR"
                label="Change department avatar"
                disabled={saving || !canEdit}
              />
            </div>
            <div className="flex-1">
              <label className="text-foreground mb-1 block text-sm font-medium">
                Department Name
              </label>
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
              rows={3}
              disabled={saving}
              className="border-border bg-background text-foreground w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

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

// ── Edit Team Modal ───────────────────────────────────────────────────────────

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
      if (pendingAvatarUrl !== undefined)
        result = await teamApi.updateAvatar(team.id, pendingAvatarUrl)
      if (pendingBannerUrl !== undefined)
        result = await teamApi.updateBanner(team.id, pendingBannerUrl)
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
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-foreground text-lg font-semibold">Edit Team — {team.name}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Banner Image</label>
            <OrgBannerUpload
              currentUrl={displayBanner}
              onUploaded={setPendingBannerUrl}
              context="TEAM_BANNER"
              disabled={saving}
            />
          </div>

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
              rows={3}
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

export default function DepartmentFeedPage() {
  const params = useParams()
  const { user } = useAuth()
  const deptId = params?.id as string

  const [department, setDepartment] = useState<DepartmentResponse | null>(null)
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [usersMap] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deptEditOpen, setDeptEditOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamResponse | null>(null)

  useEffect(() => {
    if (!deptId) return
    const loadData = async () => {
      try {
        setLoading(true)
        const [dept, allTeams] = await Promise.all([
          departmentApi.getById(deptId),
          teamApi.getPublic(),
        ])
        setDepartment(dept)
        setTeams(allTeams.filter((t) => t.departmentId === deptId))
        const stored = localStorage.getItem(`dept_posts_${deptId}`)
        if (stored) {
          try {
            setPosts(JSON.parse(stored))
          } catch {
            /* ignore */
          }
        }
      } catch (e: any) {
        setError(e.message ?? 'Failed to load department')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [deptId])

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
    localStorage.setItem(`dept_posts_${deptId}`, JSON.stringify(updated))
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
    localStorage.setItem(`dept_posts_${deptId}`, JSON.stringify(updated))
  }

  if (loading)
    return (
      <AuthLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="text-primary h-12 w-12 animate-spin" />
        </div>
      </AuthLayout>
    )
  if (error || !department)
    return (
      <AuthLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 text-center">
          <h1 className="text-foreground text-2xl font-bold">Department not found</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </AuthLayout>
    )
  if (!user) return null

  const showDeptEdit = canEditDepartment(user, department)

  return (
    <AuthLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cover Banner */}
        <div className="relative mb-0 h-56 w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-400 to-slate-600">
          {department.bannerUrl ? (
            <img
              src={department.bannerUrl}
              alt={department.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-400 to-slate-600" />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Department Header — avatar overlaps banner */}
        <div className="bg-background mb-8 flex items-end gap-6 px-2">
          <div className="relative -mt-16 flex-shrink-0">
            <div className="bg-muted flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-lg dark:border-slate-800">
              {department.avatarUrl ? (
                <img
                  src={department.avatarUrl}
                  alt={department.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="text-foreground h-16 w-16" />
              )}
            </div>
          </div>

          <div className="flex flex-1 items-end justify-between pt-4 pb-2">
            <div>
              <h1 className="text-foreground text-3xl font-bold">{department.name}</h1>
              {department.description && (
                <p className="text-muted-foreground mt-1 text-sm">{department.description}</p>
              )}
              {department.manager && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Led by {department.manager.firstName} {department.manager.lastName}
                </p>
              )}
            </div>
            {showDeptEdit && (
              <button
                onClick={() => setDeptEditOpen(true)}
                className="border-border text-foreground hover:bg-muted flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Edit Department
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-8 lg:grid-cols-4">
          {teams.length > 0 && (
            <div className="lg:col-span-1">
              <div className="border-border bg-background sticky top-4 rounded-lg border p-4">
                <h3 className="text-foreground mb-4 text-lg font-semibold">Teams</h3>
                <div className="space-y-2">
                  {teams.map((team) => {
                    const showTeamEdit = canEditTeam(user, team, department)
                    return (
                      <div key={team.id} className="group relative">
                        <Link href={`/team/${team.id}`}>
                          <div className="hover:bg-muted border-border/50 block rounded-lg border p-3 transition-colors">
                            <div className="flex items-center gap-2">
                              <div className="bg-muted h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border">
                                {team.avatarUrl ? (
                                  <img
                                    src={team.avatarUrl}
                                    alt={team.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <span className="text-muted-foreground text-xs font-semibold">
                                      {team.name[0]?.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-foreground line-clamp-1 text-sm font-medium">
                                  {team.name}
                                </h4>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                  {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                        {showTeamEdit && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              setEditingTeam(team)
                            }}
                            title="Edit team"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-2 right-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className={`space-y-6 ${teams.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <CreatePost user={user} onPostCreate={handlePostCreate} />
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mb-4 text-6xl">📝</div>
                  <h2 className="text-foreground mb-2 text-xl font-semibold">No posts yet</h2>
                  <p className="text-muted-foreground">
                    Be the first to share something with your department!
                  </p>
                </div>
              ) : (
                posts.map((post, index) => (
                  <div
                    key={post.id}
                    style={{ animation: `slide-up 0.3s ease-out ${index * 50}ms` }}
                  >
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
      </div>

      {deptEditOpen && (
        <EditDepartmentModal
          department={department}
          canEdit={showDeptEdit}
          onClose={() => setDeptEditOpen(false)}
          onSaved={(updated) => {
            setDepartment(updated)
            setDeptEditOpen(false)
          }}
        />
      )}
      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSaved={(updated) => {
            setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
            setEditingTeam(null)
          }}
        />
      )}
    </AuthLayout>
  )
}
