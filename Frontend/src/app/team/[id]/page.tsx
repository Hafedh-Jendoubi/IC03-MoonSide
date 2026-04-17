'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Users, Pencil, X } from 'lucide-react'
import { teamApi, departmentApi, TeamResponse } from '@/lib/api'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { useAuth } from '@/lib/auth-context'
import { Post, User, hasRole } from '@/lib/types'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Returns true when the logged-in user may edit this team. */
function canEditTeam(
  user: User | null,
  team: TeamResponse | null,
  userManagedDeptIds: string[]
): boolean {
  if (!user || !team) return false
  if (hasRole(user, 'ADMIN')) return true
  if (hasRole(user, 'TEAM_LEADER') && team.leadId === user.id) return true
  if (hasRole(user, 'DEPARTMENT_MANAGER') && userManagedDeptIds.includes(team.departmentId))
    return true
  return false
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) return
    try {
      setSaving(true)
      setError(null)
      const updated = await teamApi.update(team.id, {
        name: name.trim(),
        description: description.trim(),
        departmentId: team.departmentId,
        leadId: team.leadId ?? undefined,
        image: team.image ?? undefined,
        teamVisibility: visibility,
      })
      onSaved(updated)
    } catch (e: any) {
      setError(e.message ?? 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background w-full max-w-md rounded-xl shadow-xl">
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
        <div className="space-y-4 px-6 py-5">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              className="border-border bg-background text-foreground w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
              className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // IDs of departments this user manages (needed for dept-manager check)
  const [userManagedDeptIds, setUserManagedDeptIds] = useState<string[]>([])
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!teamId) return

    const loadData = async () => {
      try {
        setLoading(true)
        const teamData = await teamApi.getById(teamId)
        setTeam(teamData)

        // Load posts from localStorage
        const storedPosts = localStorage.getItem(`team_posts_${teamId}`)
        if (storedPosts) {
          try {
            setPosts(JSON.parse(storedPosts))
          } catch {
            console.error('Failed to parse stored posts')
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

  // Fetch departments managed by this user (for DEPARTMENT_MANAGER role check)
  useEffect(() => {
    if (!user || !hasRole(user, 'DEPARTMENT_MANAGER')) return
    departmentApi
      .getAll()
      .then((depts) => {
        const managed = depts.filter((d) => d.managerId === user.id).map((d) => d.id)
        setUserManagedDeptIds(managed)
      })
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
    const updatedPosts = [newPost, ...posts]
    setPosts(updatedPosts)
    localStorage.setItem(`team_posts_${teamId}`, JSON.stringify(updatedPosts))
  }

  const handleLike = (postId: string) => {
    if (!user) return
    const updatedPosts = posts.map((post) => {
      if (post.id !== postId) return post
      const hasLiked = post.likes.includes(user.id)
      return {
        ...post,
        likes: hasLiked ? post.likes.filter((id) => id !== user.id) : [...post.likes, user.id],
      }
    })
    setPosts(updatedPosts)
    localStorage.setItem(`team_posts_${teamId}`, JSON.stringify(updatedPosts))
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
        <div className="from-primary/20 to-secondary/20 mb-6 h-48 rounded-xl bg-gradient-to-r"></div>

        {/* Team Header Card */}
        <div className="bg-background mb-8 flex items-end gap-6">
          {/* Team Icon */}
          <div className="bg-muted flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full border-4 border-white shadow-lg dark:border-slate-800">
            <Users className="text-foreground h-16 w-16" />
          </div>

          {/* Team Info */}
          <div className="flex flex-1 items-end justify-between pb-2">
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
              <p className="text-muted-foreground mt-2 text-xs">{team.memberCount} members</p>
            </div>

            {/* Edit button — visible only to authorised users */}
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

        {/* Main Content - Full Width Feed */}
        <div className="space-y-6">
          {/* Create Post */}
          <CreatePost user={user} onPostCreate={handlePostCreate} />

          {/* Posts Feed */}
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

      {/* Edit Modal */}
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
    </AuthLayout>
  )
}
