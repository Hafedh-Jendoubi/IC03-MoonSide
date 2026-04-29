'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  Loader2,
  Building2,
  X,
  Users,
  UserMinus,
  Bell,
  BellOff,
  UserPlus,
  ArrowLeft,
  Settings,
  LayoutDashboard,
  Search,
  CheckCircle2,
  Image as ImageIcon,
  Type,
  Eye,
  ChevronRight,
  Shield,
  Layers,
  Trash2,
  Plus,
  MoreVertical,
  Crown,
  LogOut,
  ArrowUpRight,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  departmentApi,
  teamApi,
  DepartmentResponse,
  TeamResponse,
  UserTeamResponse,
  UserResponse,
  userApi,
} from '@/lib/api'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { OrgAvatarUpload, OrgBannerUpload } from '@/components/org-image-upload'
import { useAuth } from '@/lib/auth-context'
import { Post, User, hasRole } from '@/lib/types'
import Link from 'next/link'

// ── helpers ───────────────────────────────────────────────────────────────────

function canEditDepartment(user: User | null, department: DepartmentResponse | null): boolean {
  if (!user || !department) return false
  if (hasRole(user, 'CEO')) return true
  if (hasRole(user, 'DEPARTMENT_LEADER') && department.managerId === user.id) return true
  return false
}

function canManageTeam(
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

function canAssignToTeam(
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

// ── Manage Department Panel ───────────────────────────────────────────────────

type DeptSection = 'general' | 'teams' | 'settings'

interface ManageDeptPanelProps {
  department: DepartmentResponse
  teams: TeamResponse[]
  onClose: () => void
  onSaved: (updated: DepartmentResponse) => void
  onTeamUpdated: (updated: TeamResponse) => void
  onTeamDeleted: (teamId: string) => void
  onTeamCreated: (team: TeamResponse) => void
  onMemberChange: (teamId: string, delta: number) => void
  user: User
}

function ManageDeptPanel({
  department,
  teams,
  onClose,
  onSaved,
  onTeamUpdated,
  onTeamDeleted,
  onTeamCreated,
  onMemberChange,
  user,
}: ManageDeptPanelProps) {
  const [section, setSection] = useState<DeptSection>('general')

  const navItems: { id: DeptSection; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'teams', label: 'Teams & Members', icon: <Layers className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <div className="bg-background fixed inset-0 z-50 flex">
      {/* Left Sidebar */}
      <aside className="bg-muted/30 flex w-60 flex-shrink-0 flex-col border-r">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border">
            {department.avatarUrl ? (
              <img
                src={department.avatarUrl}
                alt={department.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="text-muted-foreground h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground mb-0.5 text-xs leading-none font-medium tracking-wide uppercase">
              Department
            </p>
            <p className="text-foreground truncate text-sm font-semibold">{department.name}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                section === item.id
                  ? 'bg-background text-foreground border-border/60 border shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
              }`}
            >
              {item.icon}
              {item.label}
              {section === item.id && (
                <ChevronRight className="text-muted-foreground ml-auto h-3.5 w-3.5" />
              )}
            </button>
          ))}
        </nav>

        <div className="border-t px-3 py-4">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-background/60 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Department
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          {section === 'general' && (
            <DeptGeneralSection department={department} onSaved={onSaved} />
          )}
          {section === 'teams' && (
            <DeptTeamsSection
              department={department}
              teams={teams}
              user={user}
              onTeamUpdated={onTeamUpdated}
              onTeamDeleted={onTeamDeleted}
              onTeamCreated={onTeamCreated}
              onMemberChange={onMemberChange}
            />
          )}
          {section === 'settings' && <DeptSettingsSection department={department} />}
        </div>
      </main>
    </div>
  )
}

// ── Dept General Section ──────────────────────────────────────────────────────

function DeptGeneralSection({
  department,
  onSaved,
}: {
  department: DepartmentResponse
  onSaved: (d: DepartmentResponse) => void
}) {
  const [name, setName] = useState(department.name)
  const [description, setDescription] = useState(department.description ?? '')
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null | undefined>(undefined)
  const [pendingBannerUrl, setPendingBannerUrl] = useState<string | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState(false)

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
      if (pendingAvatarUrl !== undefined)
        result = await departmentApi.updateAvatar(department.id, pendingAvatarUrl)
      if (pendingBannerUrl !== undefined)
        result = await departmentApi.updateBanner(department.id, pendingBannerUrl)
      onSaved(result)
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 3000)
    } catch (e: any) {
      setError(e.message ?? 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold">General</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your department's profile and appearance.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" /> Changes saved successfully.
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="text-muted-foreground h-4 w-4" />
          <label className="text-foreground text-sm font-medium">Banner Image</label>
        </div>
        <OrgBannerUpload
          currentUrl={displayBanner}
          onUploaded={setPendingBannerUrl}
          context="DEPT_BANNER"
          disabled={saving}
        />
      </div>

      <div className="flex items-end gap-5">
        <div className="flex-shrink-0">
          <label className="text-foreground mb-2 block text-sm font-medium">
            Department Avatar
          </label>
          <OrgAvatarUpload
            currentUrl={displayAvatar}
            onUploaded={setPendingAvatarUrl}
            context="DEPT_AVATAR"
            label="Change avatar"
            disabled={saving}
          />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Type className="text-muted-foreground h-4 w-4" />
            <label className="text-foreground text-sm font-medium">Department Name</label>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            disabled={saving}
            className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:opacity-60"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-foreground text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={4}
          disabled={saving}
          placeholder="What does this department do?"
          className="border-border bg-background text-foreground focus:ring-primary w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:opacity-60"
        />
        <p className="text-muted-foreground text-right text-xs">{description.length}/500</p>
      </div>

      <div className="flex justify-end border-t pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ── Dept Teams & Members Section ──────────────────────────────────────────────

function DeptTeamsSection({
  department,
  teams,
  user,
  onTeamUpdated,
  onTeamDeleted,
  onTeamCreated,
  onMemberChange,
}: {
  department: DepartmentResponse
  teams: TeamResponse[]
  user: User
  onTeamUpdated: (t: TeamResponse) => void
  onTeamDeleted: (teamId: string) => void
  onTeamCreated: (team: TeamResponse) => void
  onMemberChange: (teamId: string, delta: number) => void
}) {
  const [localTeams, setLocalTeams] = useState<TeamResponse[]>(teams)
  const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(teams[0] ?? null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null)
  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState<TeamResponse | null>(null)

  const canDeleteTeams =
    user &&
    (hasRole(user, 'CEO') ||
      (hasRole(user, 'DEPARTMENT_LEADER') && department.managerId === user.id))

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const created = await teamApi.create({
        name: newTeamName.trim(),
        description: newTeamDesc.trim(),
        departmentId: department.id,
        teamVisibility: 'PUBLIC',
      })
      const updated = [created, ...localTeams]
      setLocalTeams(updated)
      setSelectedTeam(created)
      setShowCreateForm(false)
      setNewTeamName('')
      setNewTeamDesc('')
      onTeamCreated(created)
    } catch (e: any) {
      setCreateError(e.message ?? 'Failed to create team')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTeam = async (team: TeamResponse) => {
    setConfirmDeleteTeam(null)
    setDeletingTeamId(team.id)
    try {
      await teamApi.delete(team.id)
      const updated = localTeams.filter((t) => t.id !== team.id)
      setLocalTeams(updated)
      if (selectedTeam?.id === team.id) setSelectedTeam(updated[0] ?? null)
      onTeamDeleted(team.id)
    } catch (e: any) {
      // ignore silently
    } finally {
      setDeletingTeamId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-foreground text-2xl font-bold">Teams & Members</h1>
          {canDeleteTeams && (
            <button
              onClick={() => {
                setShowCreateForm((v) => !v)
                setCreateError(null)
              }}
              className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Team
            </button>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {localTeams.length} team{localTeams.length !== 1 ? 's' : ''} in this department.
        </p>
      </div>

      {/* Create Team Form */}
      {showCreateForm && (
        <div className="bg-muted/20 space-y-3 rounded-xl border p-5">
          <h3 className="text-foreground text-sm font-semibold">Create New Team</h3>
          {createError && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-3 py-2 text-xs">
              {createError}
            </div>
          )}
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Team name"
            className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
          <textarea
            value={newTeamDesc}
            onChange={(e) => setNewTeamDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="border-border bg-background text-foreground focus:ring-primary w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowCreateForm(false)
                setNewTeamName('')
                setNewTeamDesc('')
                setCreateError(null)
              }}
              className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTeam}
              disabled={creating || !newTeamName.trim()}
              className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {localTeams.length === 0 && (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <Layers className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
          <p className="text-muted-foreground text-sm">No teams in this department yet.</p>
        </div>
      )}

      {localTeams.length > 0 && (
        <div className="flex gap-4">
          {/* Team Picker */}
          <div className="w-44 flex-shrink-0 space-y-1">
            {localTeams.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeam(t)}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedTeam?.id === t.id
                    ? 'bg-primary/10 text-primary border-primary/20 border font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="bg-muted h-6 w-6 flex-shrink-0 overflow-hidden rounded-full border">
                  {t.avatarUrl ? (
                    <img src={t.avatarUrl} alt={t.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-muted-foreground text-[10px] font-bold">
                        {t.name[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                {canDeleteTeams && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDeleteTeam(t)
                    }}
                    disabled={deletingTeamId === t.id}
                    className="text-muted-foreground hover:text-destructive ml-auto flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                    title="Delete team"
                  >
                    {deletingTeamId === t.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </button>
            ))}
          </div>

          {/* Team Members Panel */}
          <div className="min-w-0 flex-1">
            {selectedTeam && (
              <TeamMembersPanel
                team={selectedTeam}
                department={department}
                user={user}
                onMemberChange={(delta) => onMemberChange(selectedTeam.id, delta)}
              />
            )}
          </div>
        </div>
      )}

      {confirmDeleteTeam && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background w-full max-w-sm rounded-xl border p-6 shadow-xl">
            <h3 className="text-foreground mb-2 text-base font-semibold">Delete Team</h3>
            <p className="text-muted-foreground mb-5 text-sm">
              Are you sure you want to delete{' '}
              <span className="text-foreground font-medium">{confirmDeleteTeam.name}</span>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteTeam(null)}
                className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTeam(confirmDeleteTeam)}
                className="bg-destructive text-destructive-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Team Members Panel (inside dept manage) ───────────────────────────────────

function TeamMembersPanel({
  team,
  department,
  user,
  onMemberChange,
}: {
  team: TeamResponse
  department: DepartmentResponse
  user: User
  onMemberChange: (delta: number) => void
}) {
  const canKick = canManageTeam(user, team, department)
  const canAdd = canAssignToTeam(user, team, department)

  const [members, setMembers] = useState<UserTeamResponse[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [kickingId, setKickingId] = useState<string | null>(null)
  const [confirmKick, setConfirmKick] = useState<UserTeamResponse | null>(null)
  const [promotingId, setPromotingId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'promote' | 'kick' | 'move'
    member: UserTeamResponse
    targetTeamId?: string
  } | null>(null)

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserResponse[]>([])
  const [searching, setSearching] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLoadingMembers(true)
    setMembersError(null)
    teamApi
      .getMembers(team.id)
      .then(setMembers)
      .catch((e: any) => setMembersError(e.message ?? 'Failed to load members'))
      .finally(() => setLoadingMembers(false))
  }, [team.id])

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    searchRef.current = setTimeout(async () => {
      try {
        const all = await userApi.getAll()
        const q = query.toLowerCase()
        const memberIds = new Set(members.map((m) => m.userId))
        const filtered = all.filter(
          (u) =>
            !memberIds.has(u.id) &&
            (u.firstName.toLowerCase().includes(q) ||
              u.lastName.toLowerCase().includes(q) ||
              u.email.toLowerCase().includes(q) ||
              (u.jobTitle ?? '').toLowerCase().includes(q))
        )
        setSearchResults(filtered.slice(0, 8))
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [query, members])

  const handleAssign = async (u: UserResponse) => {
    setAssignError(null)
    setAssigningId(u.id)
    try {
      await teamApi.assignMember(team.id, u.id)
      onMemberChange(1)
      const updated = await teamApi.getMembers(team.id)
      setMembers(updated)
      setQuery('')
      setSearchResults([])
    } catch (e: any) {
      setAssignError(e.message ?? 'Failed to assign member')
    } finally {
      setAssigningId(null)
    }
  }

  const handleKick = async (member: UserTeamResponse) => {
    setConfirmKick(null)
    setConfirmAction(null)
    setKickingId(member.userId)
    try {
      await teamApi.removeMember(team.id, member.userId)
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId))
      onMemberChange(-1)
    } catch (e: any) {
      setMembersError(e.message ?? 'Failed to remove member')
    } finally {
      setKickingId(null)
    }
  }

  const handlePromoteAsLeader = async (member: UserTeamResponse) => {
    setConfirmAction(null)
    setPromotingId(member.userId)
    try {
      await teamApi.assignLead(team.id, member.userId)
      const updated = await teamApi.getMembers(team.id)
      setMembers(updated)
      // Note: The parent should refresh to see the updated lead
    } catch (e: any) {
      setMembersError(e.message ?? 'Failed to promote member')
    } finally {
      setPromotingId(null)
    }
  }

  const currentMemberIds = new Set(members.map((m) => m.userId))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">{team.name}</h3>
        <span className="text-muted-foreground text-xs">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Add Member */}
      {canAdd && (
        <div className="bg-muted/20 space-y-3 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <UserPlus className="text-primary h-3.5 w-3.5" />
            <span className="text-foreground text-xs font-semibold">Add a Member</span>
          </div>

          {assignError && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-3 py-2 text-xs">
              {assignError}
            </div>
          )}

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employees by name, email, or role…"
              className="bg-background focus:ring-primary w-full rounded-lg border py-2 pr-4 pl-8 text-xs focus:ring-2 focus:outline-none"
            />
            {searching && (
              <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 animate-spin" />
            )}
          </div>

          {searchResults.length > 0 && (
            <ul className="bg-background divide-y overflow-hidden rounded-lg border shadow-sm">
              {searchResults.map((u) => {
                const isAssigning = assigningId === u.id
                const alreadyMember = currentMemberIds.has(u.id)
                return (
                  <li
                    key={u.id}
                    className="hover:bg-muted/40 flex items-center justify-between px-3 py-2 transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="bg-muted h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={`${u.firstName} ${u.lastName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-muted-foreground text-[10px] font-semibold">
                              {u.firstName[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground text-xs leading-tight font-medium">
                          {u.firstName} {u.lastName}
                        </p>
                        {u.jobTitle && (
                          <p className="text-muted-foreground truncate text-[10px]">{u.jobTitle}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssign(u)}
                      disabled={isAssigning || alreadyMember}
                      className="bg-primary/10 text-primary hover:bg-primary/20 ml-2 flex flex-shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isAssigning ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : alreadyMember ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <UserPlus className="h-3 w-3" />
                      )}
                      {alreadyMember ? 'Member' : 'Add'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {query.trim() && !searching && searchResults.length === 0 && (
            <p className="text-muted-foreground py-2 text-center text-xs">
              No employees found matching &quot;{query}&quot;
            </p>
          )}
        </div>
      )}

      {/* Members List */}
      {membersError && (
        <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
          {membersError}
        </div>
      )}
      {loadingMembers && (
        <div className="flex justify-center py-6">
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
        </div>
      )}

      {!loadingMembers && !membersError && members.length === 0 && (
        <div className="rounded-xl border border-dashed py-8 text-center">
          <Users className="text-muted-foreground mx-auto mb-1.5 h-6 w-6" />
          <p className="text-muted-foreground text-xs">No members in this team yet.</p>
        </div>
      )}

      {!loadingMembers && members.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {members.map((member) => {
            const u = member.user
            const isLead = member.userId === team.leadId
            const isKicking = kickingId === member.userId
            return (
              <li
                key={member.id}
                className="bg-background flex items-center justify-between px-4 py-3 transition-colors"
              >
                <Link
                  href={`/profile/${member.userId}`}
                  className="hover:bg-muted/30 flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors"
                >
                  <div className="bg-muted h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border">
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-foreground text-sm leading-tight font-medium">
                        {u ? `${u.firstName} ${u.lastName}` : 'Unknown User'}
                      </p>
                      {isLead && (
                        <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                          <Shield className="h-2.5 w-2.5" /> Leader
                        </span>
                      )}
                    </div>
                    {u?.jobTitle && (
                      <p className="text-muted-foreground truncate text-xs">{u.jobTitle}</p>
                    )}
                  </div>
                </Link>
                {canKick && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isKicking || promotingId === member.userId}
                      >
                        {isKicking || promotingId === member.userId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!isLead && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmAction({
                                type: 'promote',
                                member,
                              })
                            }
                          >
                            <Crown className="mr-2 h-4 w-4" /> Promote as Leader
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          setConfirmAction({
                            type: 'kick',
                            member,
                          })
                        }
                        className="text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Remove from Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background w-full max-w-sm rounded-xl border p-6 shadow-xl">
            {confirmAction.type === 'promote' && (
              <>
                <h3 className="text-foreground mb-2 text-base font-semibold">
                  Promote to Team Leader
                </h3>
                <p className="text-muted-foreground mb-5 text-sm">
                  Promote{' '}
                  <span className="text-foreground font-medium">
                    {confirmAction.member.user
                      ? `${confirmAction.member.user.firstName} ${confirmAction.member.user.lastName}`
                      : 'this member'}
                  </span>{' '}
                  to be the leader of{' '}
                  <span className="text-foreground font-medium">{team.name}</span>?
                </p>
              </>
            )}
            {confirmAction.type === 'kick' && (
              <>
                <h3 className="text-foreground mb-2 text-base font-semibold">Remove Member</h3>
                <p className="text-muted-foreground mb-5 text-sm">
                  Are you sure you want to remove{' '}
                  <span className="text-foreground font-medium">
                    {confirmAction.member.user
                      ? `${confirmAction.member.user.firstName} ${confirmAction.member.user.lastName}`
                      : 'this member'}
                  </span>{' '}
                  from <span className="text-foreground font-medium">{team.name}</span>?
                </p>
              </>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'promote') {
                    handlePromoteAsLeader(confirmAction.member)
                  } else if (confirmAction.type === 'kick') {
                    handleKick(confirmAction.member)
                  }
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-opacity ${
                  confirmAction.type === 'kick'
                    ? 'bg-destructive text-destructive-foreground hover:opacity-90'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {confirmAction.type === 'promote' ? 'Promote' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dept Settings Section ─────────────────────────────────────────────────────

function DeptSettingsSection({ department }: { department: DepartmentResponse }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Department configuration and info.</p>
      </div>
      <div className="divide-y rounded-xl border">
        <div className="space-y-2 p-5">
          <div className="flex items-center gap-2">
            <Eye className="text-muted-foreground h-4 w-4" />
            <h2 className="text-foreground text-sm font-semibold">Status</h2>
          </div>
          <p className="text-muted-foreground text-xs">
            The current activation state of this department.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${department.isActive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${department.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`}
              />
              {department.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="space-y-1 p-5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Teams</p>
          <p className="text-foreground text-2xl font-bold">{department.teamCount}</p>
        </div>
        <div className="space-y-1 p-5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Followers
          </p>
          <p className="text-foreground text-2xl font-bold">{department.followerCount}</p>
        </div>
      </div>
    </div>
  )
}

// ── Team Members Modal (view-only, from sidebar) ──────────────────────────────

interface TeamMembersModalProps {
  team: TeamResponse
  canKick: boolean
  onClose: () => void
  onMemberKicked: (teamId: string) => void
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
      onMemberKicked(team.id)
    } catch (e: any) {
      setError(e.message ?? 'Failed to remove member')
    } finally {
      setKickingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background w-full max-w-md rounded-xl shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-5 w-5" />
            <h2 className="text-foreground text-lg font-semibold">
              {team.name}{' '}
              <span className="text-muted-foreground text-base font-normal">
                · {members.length} member{members.length !== 1 ? 's' : ''}
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
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                  >
                    <Link
                      href={`/profile/${member.userId}`}
                      onClick={onClose}
                      className="hover:bg-muted/40 flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors"
                    >
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
                    </Link>
                    {canKick && !isLead && (
                      <button
                        onClick={() => setConfirmKick(member)}
                        disabled={isKicking}
                        title="Remove from team"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2 rounded-lg p-1.5 transition-colors disabled:opacity-50"
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
        <div className="flex justify-end border-t px-6 py-4">
          <button
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {confirmKick && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background w-full max-w-sm rounded-xl p-6 shadow-xl">
            <h3 className="text-foreground mb-2 text-base font-semibold">Remove Member</h3>
            <p className="text-muted-foreground mb-5 text-sm">
              Remove{' '}
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
                className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleKick(confirmKick)}
                className="bg-destructive text-destructive-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90"
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
  const [manageOpen, setManageOpen] = useState(false)
  const [membersTeam, setMembersTeam] = useState<TeamResponse | null>(null)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    if (!deptId) return
    const loadData = async () => {
      try {
        setLoading(true)
        const [dept, allTeams] = await Promise.all([
          departmentApi.getById(deptId),
          teamApi.getByDepartment(deptId),
        ])
        setDepartment(dept)
        setTeams(allTeams)
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

  const handleMemberKicked = (teamId: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, memberCount: Math.max(0, t.memberCount - 1) } : t))
    )
  }

  const handleMemberChange = (teamId: string, delta: number) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, memberCount: Math.max(0, t.memberCount + delta) } : t
      )
    )
  }

  const handleFollow = async () => {
    if (!department) return
    setFollowLoading(true)
    try {
      const updated = department.isFollowing
        ? await departmentApi.unfollow(department.id)
        : await departmentApi.follow(department.id)
      setDepartment(updated)
    } catch {
      /* silently ignore */
    } finally {
      setFollowLoading(false)
    }
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

  const showManageButton =
    hasRole(user, 'CEO') || (hasRole(user, 'DEPARTMENT_LEADER') && department.managerId === user.id)

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

        {/* Department Header */}
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
            <div className="flex flex-wrap items-center justify-end gap-2">
              {/* Follow / Unfollow */}
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                  department.isFollowing
                    ? 'border-primary text-primary hover:bg-primary/10'
                    : 'border-border text-foreground hover:bg-muted'
                }`}
              >
                {followLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : department.isFollowing ? (
                  <BellOff className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {department.isFollowing ? 'Following' : 'Follow'}
                {department.followerCount > 0 && (
                  <span className="text-muted-foreground text-xs">
                    ({department.followerCount})
                  </span>
                )}
              </button>

              {/* Manage Department */}
              {showManageButton && (
                <button
                  onClick={() => setManageOpen(true)}
                  className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                >
                  <Settings className="h-4 w-4" />
                  Manage Department
                </button>
              )}
            </div>
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
                              <div className="min-w-0 flex-1">
                                <h4 className="text-foreground line-clamp-1 text-sm font-medium">
                                  {team.name}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setMembersTeam(team)
                                  }}
                                  className="text-muted-foreground hover:text-primary mt-0.5 flex items-center gap-1 text-xs transition-colors hover:underline"
                                  title="View members"
                                >
                                  <Users className="h-3 w-3" />
                                  {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                                </button>
                              </div>
                            </div>
                          </div>
                        </Link>
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

      {manageOpen && (
        <ManageDeptPanel
          department={department}
          teams={teams}
          user={user}
          onClose={() => setManageOpen(false)}
          onSaved={(updated) => setDepartment(updated)}
          onTeamUpdated={(updated) =>
            setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          }
          onTeamDeleted={(teamId) => setTeams((prev) => prev.filter((t) => t.id !== teamId))}
          onTeamCreated={(team) => setTeams((prev) => [...prev, team])}
          onMemberChange={handleMemberChange}
        />
      )}

      {membersTeam && (
        <TeamMembersModal
          team={membersTeam}
          canKick={canManageTeam(user, membersTeam, department)}
          onClose={() => setMembersTeam(null)}
          onMemberKicked={handleMemberKicked}
        />
      )}
    </AuthLayout>
  )
}
