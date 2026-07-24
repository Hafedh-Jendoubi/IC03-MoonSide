'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
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
  FolderKanban,
  Pencil,
  Github,
  ExternalLink,
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
  postApi,
  projectApi,
  DepartmentResponse,
  TeamResponse,
  UserTeamResponse,
  UserResponse,
  PostResponse,
  ProjectResponse,
  ProjectRequest,
  ProjectStatus,
  userApi,
} from '@/lib/api'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { OrgAvatarUpload, OrgBannerUpload } from '@/components/org-image-upload'
import { useAuth } from '@/lib/auth-context'
import { User, hasRole } from '@/lib/types'
import { UsersModal } from '@/components/users-modal'
import { PostViewModal } from '@/components/post-view-modal'
import { usePostFeed } from '@/hooks/use-post-feed'

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

/**
 * Returns true when the current user is allowed to view the member list of a team.
 * - If the department has membersPublic=true (or undefined/null), everyone can.
 * - If membersPublic=false: only CEO, the Department Leader, a Team Leader of
 *   that specific team, or a member of that team can see the list.
 */
function canViewTeamMembers(
  user: User | null,
  team: TeamResponse,
  department: DepartmentResponse | null,
  userTeamIds: string[]
): boolean {
  if (!department || department.membersPublic !== false) return true
  if (!user) return false
  if (hasRole(user, 'CEO')) return true
  if (hasRole(user, 'DEPARTMENT_LEADER') && department.managerId === user.id) return true
  if (hasRole(user, 'TEAM_LEADER') && team.leadId === user.id) return true
  if (userTeamIds.includes(team.id)) return true
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

// ── Team Sidebar Card Component ───────────────────────────────────────────────

interface TeamSidebarCardProps {
  team: TeamResponse
  department: DepartmentResponse | null
  user: User | null
  userTeamIds: string[]
  setMembersTeam: (team: TeamResponse) => void
}

function TeamSidebarCard({
  team,
  department,
  user,
  userTeamIds,
  setMembersTeam,
}: TeamSidebarCardProps) {
  const canView = canViewTeamMembers(user, team, department, userTeamIds)
  const isMember = userTeamIds.includes(team.id)

  return (
    <div className="group relative">
      <Link href={`/team/${team.id}`}>
        <div
          className={`hover:bg-muted block rounded-lg border p-3 transition-colors ${
            isMember
              ? 'border-green-500/50 bg-green-500/5 hover:bg-green-500/10'
              : 'border-border/50'
          }`}
          title={team.name}
        >
          <div className="flex items-center gap-2">
            <div className="bg-muted h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border">
              {team.avatarUrl ? (
                <img src={team.avatarUrl} alt={team.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-muted-foreground text-xs font-semibold">
                    {team.name[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-foreground line-clamp-1 text-sm font-medium" title={team.name}>
                  {team.name}
                </h4>
                {isMember && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Member
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (canView) setMembersTeam(team)
                }}
                className={`mt-0.5 flex items-center gap-1 text-xs transition-colors ${
                  canView
                    ? 'text-muted-foreground hover:text-primary hover:underline'
                    : 'text-muted-foreground/50 cursor-not-allowed'
                }`}
                title={canView ? 'View members' : 'Member list is restricted to department members'}
              >
                <Users className="h-3 w-3" />
                {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                {!canView && <Shield className="ml-0.5 h-3 w-3 opacity-60" />}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

// ── Manage Department Panel ───────────────────────────────────────────────────

type DeptSection = 'general' | 'teams' | 'projects' | 'settings'

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

  // ── ADD THIS USEEFFECT TO LOCK BODY SCROLL ─────────────────────────────────
  useEffect(() => {
    // Save original body overflow style
    const originalStyle = window.getComputedStyle(document.body).overflow

    // Prevent scrolling on the background page
    document.body.style.overflow = 'hidden'

    // Restore original overflow when the panel closes
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])
  // ───────────────────────────────────────────────────────────────────────────

  const navItems: { id: DeptSection; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'teams', label: 'Teams & Members', icon: <Layers className="h-4 w-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <div className="bg-background fixed inset-0 z-50 flex">
      {/* Left Sidebar - Fixed width */}
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

      {/* Main Content - Now using full width with responsive max-width for better readability */}
      <main className="flex-1 overflow-y-auto">
        {/* REMOVED: mx-auto max-w-2xl */}
        <div className="w-full px-4 py-8 md:px-8 lg:px-12 xl:px-16">
          {/* For very large screens, we add a max-width to maintain readability */}
          <div className="mx-auto w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">
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
            {section === 'projects' && (
              <DeptProjectsSection department={department} teams={teams} user={user} />
            )}
            {section === 'settings' && <DeptSettingsSection department={department} />}
          </div>
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

// ── Team Visibility Section ───────────────────────────────────────────────────

interface TeamVisibilitySectionProps {
  teams: TeamResponse[]
  label: string
  icon: string
  selectedTeam: TeamResponse | null
  onSelectTeam: (team: TeamResponse) => void
  onDelete: (team: TeamResponse) => void
  deletingTeamId: string | null
  canDelete: boolean
}

function TeamVisibilitySection({
  teams,
  label,
  icon,
  selectedTeam,
  onSelectTeam,
  onDelete,
  deletingTeamId,
  canDelete,
}: TeamVisibilitySectionProps) {
  const [expanded, setExpanded] = useState(true)

  if (teams.length === 0) return null

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 px-2 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors"
      >
        <span>{icon}</span>
        <span>{label}</span>
        <span className="text-muted-foreground/60 ml-auto text-[11px]">({teams.length})</span>
        <ChevronRight
          className={`text-muted-foreground/60 h-3 w-3 transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="space-y-1">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTeam(t)}
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
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(t)
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
      )}
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
          <div className="w-56 flex-shrink-0 space-y-4">
            {/* Public Teams Section */}
            <TeamVisibilitySection
              teams={localTeams.filter((t) => t.teamVisibility === 'PUBLIC')}
              label="Public Teams"
              icon="🔓"
              selectedTeam={selectedTeam}
              onSelectTeam={setSelectedTeam}
              onDelete={setConfirmDeleteTeam}
              deletingTeamId={deletingTeamId}
              canDelete={canDeleteTeams}
            />

            {/* Private Teams Section */}
            <TeamVisibilitySection
              teams={localTeams.filter((t) => t.teamVisibility === 'PRIVATE')}
              label="Private Teams"
              icon="🔒"
              selectedTeam={selectedTeam}
              onSelectTeam={setSelectedTeam}
              onDelete={setConfirmDeleteTeam}
              deletingTeamId={deletingTeamId}
              canDelete={canDeleteTeams}
            />
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

// ── Dept Projects Section ─────────────────────────────────────────────────────

const DEPT_PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const DEPT_PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bg: string }
> = {
  PLANNING: { label: 'Planning', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ON_HOLD: { label: 'On Hold', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  COMPLETED: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-500/10' },
  CANCELLED: { label: 'Cancelled', color: 'text-destructive', bg: 'bg-destructive/10' },
  ARCHIVED: { label: 'Archived', color: 'text-muted-foreground', bg: 'bg-muted' },
}

function DeptProjectsSection({
  department,
  teams,
  user,
}: {
  department: DepartmentResponse
  teams: TeamResponse[]
  user: User
}) {
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStatus, setFormStatus] = useState<ProjectStatus>('PLANNING')
  const [formTeamId, setFormTeamId] = useState(teams[0]?.id ?? '')
  const [formTechnologies, setFormTechnologies] = useState('')
  const [formRepoUrl, setFormRepoUrl] = useState('')
  const [formProjectUrl, setFormProjectUrl] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')

  const canManage =
    hasRole(user, 'CEO') || (hasRole(user, 'DEPARTMENT_LEADER') && department.managerId === user.id)

  useEffect(() => {
    projectApi
      .getByDepartment(department.id)
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [department.id])

  function openCreate() {
    setEditingProject(null)
    setFormName('')
    setFormDescription('')
    setFormStatus('PLANNING')
    setFormTeamId(teams[0]?.id ?? '')
    setFormTechnologies('')
    setFormRepoUrl('')
    setFormProjectUrl('')
    setFormStartDate('')
    setFormEndDate('')
    setError(null)
    setShowForm(true)
  }

  function openEdit(p: ProjectResponse) {
    setEditingProject(p)
    setFormName(p.name)
    setFormDescription(p.description ?? '')
    setFormStatus(p.status)
    // pre-select the first team of this project that belongs to this dept
    const matchingTeam = p.teams?.find((t) => teams.some((dt) => dt.id === t.id))
    setFormTeamId(matchingTeam?.id ?? teams[0]?.id ?? '')
    setFormTechnologies((p.technologies ?? []).join(', '))
    setFormRepoUrl(p.repositoryUrl ?? '')
    setFormProjectUrl(p.projectUrl ?? '')
    setFormStartDate(p.startDate ?? '')
    setFormEndDate(p.endDate ?? '')
    setError(null)
    setShowForm(true)
  }

  async function handleSave() {
    if (!formName.trim() || !formTeamId) return
    setSaving(true)
    setError(null)
    const payload: ProjectRequest = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      status: formStatus,
      technologies: formTechnologies
        ? formTechnologies
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      repositoryUrl: formRepoUrl.trim() || undefined,
      projectUrl: formProjectUrl.trim() || undefined,
      startDate: formStartDate || undefined,
      endDate: formEndDate || undefined,
      teamIds: [formTeamId],
    }
    try {
      if (editingProject) {
        const updated = await projectApi.update(editingProject.id, payload)
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      } else {
        const created = await projectApi.createForDepartment(department.id, payload)
        setProjects((prev) => [created, ...prev])
      }
      setShowForm(false)
    } catch (e: any) {
      setError(e.message ?? 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(p: ProjectResponse) {
    setDeletingId(p.id)
    try {
      await projectApi.delete(p.id)
      setProjects((prev) => prev.filter((x) => x.id !== p.id))
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete project')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage projects for teams in this department.
          </p>
        </div>
        {canManage && !showForm && teams.length > 0 && (
          <button
            onClick={openCreate}
            className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {teams.length === 0 && (
        <div className="rounded-xl border border-dashed py-10 text-center">
          <Layers className="text-muted-foreground/40 mx-auto mb-3 h-8 w-8" />
          <p className="text-foreground text-sm font-medium">No teams in this department yet</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Create a team first before adding projects.
          </p>
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && teams.length > 0 && (
        <div className="bg-muted/20 space-y-4 rounded-xl border p-5">
          <h3 className="text-foreground text-sm font-semibold">
            {editingProject ? 'Edit Project' : 'New Project'}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-foreground mb-1 block text-xs font-medium">
                Project Name *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Customer Portal v2"
                maxLength={120}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-foreground mb-1 block text-xs font-medium">Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="What is this project about?"
                className="border-border bg-background text-foreground focus:ring-primary w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-xs font-medium">
                Assign to Team *
              </label>
              <select
                value={formTeamId}
                onChange={(e) => setFormTeamId(e.target.value)}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-xs font-medium">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              >
                {DEPT_PROJECT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-xs font-medium">
                Technologies (comma-separated)
              </label>
              <input
                type="text"
                value={formTechnologies}
                onChange={(e) => setFormTechnologies(e.target.value)}
                placeholder="e.g. React, Spring Boot, MongoDB"
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-xs font-medium">
                Repository URL
              </label>
              <input
                type="url"
                value={formRepoUrl}
                onChange={(e) => setFormRepoUrl(e.target.value)}
                placeholder="https://github.com/org/repo"
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-xs font-medium">Project URL</label>
              <input
                type="url"
                value={formProjectUrl}
                onChange={(e) => setFormProjectUrl(e.target.value)}
                placeholder="https://myapp.example.com"
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-xs font-medium">Start Date</label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-xs font-medium">End Date</label>
              <input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              onClick={() => setShowForm(false)}
              disabled={saving}
              className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formTeamId}
              className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Saving…' : editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </div>
      )}

      {/* Project list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : projects.length === 0 && !showForm && teams.length > 0 ? (
        <div className="rounded-xl border border-dashed py-14 text-center">
          <FolderKanban className="text-muted-foreground/40 mx-auto mb-3 h-10 w-10" />
          <p className="text-foreground text-sm font-medium">No projects yet</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {canManage
              ? 'Click "New Project" to create one for a team.'
              : 'No projects assigned to teams in this department.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const cfg = DEPT_PROJECT_STATUS_CONFIG[p.status] ?? DEPT_PROJECT_STATUS_CONFIG.PLANNING
            const assignedTeam = p.teams?.find((t) => teams.some((dt) => dt.id === t.id))
            return (
              <div
                key={p.id}
                className="bg-background flex items-start gap-4 rounded-xl border p-4"
              >
                <div className="bg-muted mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <FolderKanban className="text-muted-foreground h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground text-sm leading-tight font-semibold">{p.name}</p>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                    {assignedTeam && (
                      <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                        {assignedTeam.name}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                      {p.description}
                    </p>
                  )}
                  {p.technologies && p.technologies.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.technologies.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
                        >
                          {t}
                        </span>
                      ))}
                      {p.technologies.length > 4 && (
                        <span className="text-muted-foreground text-xs">
                          +{p.technologies.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {canManage && (
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Dept Settings Section ─────────────────────────────────────────────────────

function DeptSettingsSection({ department }: { department: DepartmentResponse }) {
  const [membersPublic, setMembersPublic] = useState(department.membersPublic ?? true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showFollowersModal, setShowFollowersModal] = useState(false)

  const isDirty = membersPublic !== (department.membersPublic ?? true)

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)
    try {
      await departmentApi.update(department.id, {
        name: department.name,
        membersPublic,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e: any) {
      setSaveError(e.message ?? 'Failed to save setting')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Department configuration and info.</p>
        </div>
        <div className="divide-y rounded-xl border">
          {/* Status */}
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

          {/* Member Visibility */}
          <div className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <h2 className="text-foreground text-sm font-semibold">Member Visibility</h2>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Control who can see the member lists of teams under this department.
            </p>
            <label className="hover:bg-muted/30 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors">
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={membersPublic}
                  onChange={(e) => setMembersPublic(e.target.checked)}
                  className="peer sr-only"
                />
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${membersPublic ? 'border-primary bg-primary' : 'border-muted-foreground bg-background'}`}
                >
                  {membersPublic && (
                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-foreground text-sm font-medium">
                  Allow all users to view team members
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  {membersPublic
                    ? 'Any authenticated user can open a team member list in this department.'
                    : 'Only department members, Team Leaders, and the Department Leader can view team member lists.'}
                </p>
              </div>
            </label>

            {saveError && <p className="text-destructive text-xs">{saveError}</p>}
            {saveSuccess && (
              <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Setting saved successfully.
              </p>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-1 p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Teams
            </p>
            <p className="text-foreground text-2xl font-bold">{department.teamCount}</p>
          </div>
          <div className="space-y-1 p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Followers
            </p>
            <button
              onClick={() => setShowFollowersModal(true)}
              className="text-foreground hover:text-primary text-2xl font-bold transition-colors hover:underline"
            >
              {department.followerCount}
            </button>
          </div>
        </div>
      </div>

      <UsersModal
        open={showFollowersModal}
        onOpenChange={setShowFollowersModal}
        title="Followers"
        fetchUsers={async () => {
          const users = await departmentApi.getFollowers(department.id)
          return users.map((u) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            avatar: u.avatar,
            jobTitle: u.jobTitle,
          }))
        }}
      />
    </>
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
  const [searchQuery, setSearchQuery] = useState('')

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

  const filteredMembers = searchQuery.trim()
    ? members.filter((m) => {
        const u = m.user
        if (!u) return false
        const q = searchQuery.toLowerCase()
        return (
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          (u.jobTitle ?? '').toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q)
        )
      })
    : members

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

        {/* Search bar */}
        {!loading && members.length > 0 && (
          <div className="border-b px-6 py-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members by name, role…"
                className="bg-muted/40 focus:ring-primary w-full rounded-lg border py-2 pr-4 pl-9 text-sm focus:ring-2 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
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
          {!loading && members.length > 0 && filteredMembers.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No members match &quot;{searchQuery}&quot;
            </p>
          )}
          {!loading && filteredMembers.length > 0 && (
            <ul className="space-y-1">
              {filteredMembers.map((member) => {
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [manageOpen, setManageOpen] = useState(false)
  const [membersTeam, setMembersTeam] = useState<TeamResponse | null>(null)
  const [followLoading, setFollowLoading] = useState(false)
  const [userTeamIds, setUserTeamIds] = useState<string[]>([])
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  // Whether the current user is a member of this department (via any of its teams)
  const [isUserDeptMember, setIsUserDeptMember] = useState(false)
  const [viewPostId, setViewPostId] = useState<string | null>(null)

  // ── Post feed (paginated, infinite scroll) ────────────────────────────────
  const {
    posts,
    usersMap,
    loading: postsLoading,
    loadingMore: postsLoadingMore,
    hasMore: postsHasMore,
    prependPost,
    removePost,
    updatePost,
    sentinelRef,
  } = usePostFeed({
    scope: { type: 'department', departmentId: deptId },
    currentUser: user,
  })

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

        // CEO and dept manager are always considered members for posting purposes
        if (user) {
          const isCeo = hasRole(user, 'CEO')
          const isDeptManager = dept.managerId === user.id

          if (isCeo || isDeptManager) {
            setUserTeamIds(allTeams.map((t) => t.id))
            setIsUserDeptMember(true)
          } else {
            // Fetch actual team memberships to derive which teams the user belongs to
            const membershipResults = await Promise.allSettled(
              allTeams.map((t) =>
                teamApi.getMembers(t.id).then((members: any[]) => ({
                  teamId: t.id,
                  isMember: members.some((m) => m.userId === user.id) || t.leadId === user.id,
                }))
              )
            )
            const memberTeamIds = membershipResults
              .filter((r) => r.status === 'fulfilled' && r.value.isMember)
              .map(
                (r) =>
                  (r as PromiseFulfilledResult<{ teamId: string; isMember: boolean }>).value.teamId
              )
            setUserTeamIds(memberTeamIds)
            setIsUserDeptMember(memberTeamIds.length > 0)
          }
        }
      } catch (e: any) {
        setError(e.message ?? 'Failed to load department')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [deptId, user])

  const handlePostCreate = (post: PostResponse) => {
    if (!user) return
    prependPost(post)
  }

  const handlePostDelete = (postId: string) => {
    removePost(postId)
  }

  const handlePostUpdate = (updated: PostResponse) => {
    updatePost(updated)
  }

  const handleLike = () => {
    // Like functionality is handled by PostCard component via API calls
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
      {/* REMOVED: mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 */}
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* Responsive Grid Layout - Updated to use full width with better proportions */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left Column - Teams Section */}
          <div className="order-1 w-full lg:order-1 lg:w-1/5 lg:flex-shrink-0">
            {teams.length > 0 && (
              <div className="border-border bg-background z-10 mb-6 rounded-lg border p-4 lg:sticky lg:top-20">
                <h3 className="text-foreground mb-4 text-lg font-semibold">Teams</h3>

                {/* Joined Teams Section */}
                {teams.filter((t) => userTeamIds.includes(t.id)).length > 0 && (
                  <div className="mb-6">
                    <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-green-600 uppercase dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Your Teams
                    </h4>
                    <div className="space-y-2">
                      {teams
                        .filter((t) => userTeamIds.includes(t.id))
                        .map((team) => (
                          <TeamSidebarCard
                            key={team.id}
                            team={team}
                            department={department}
                            user={user}
                            userTeamIds={userTeamIds}
                            setMembersTeam={setMembersTeam}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Public Teams Section */}
                {teams.filter((t) => t.teamVisibility === 'PUBLIC' && !userTeamIds.includes(t.id))
                  .length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                      🔓 Public Teams
                    </h4>
                    <div className="space-y-2">
                      {teams
                        .filter((t) => t.teamVisibility === 'PUBLIC' && !userTeamIds.includes(t.id))
                        .map((team) => (
                          <TeamSidebarCard
                            key={team.id}
                            team={team}
                            department={department}
                            user={user}
                            userTeamIds={userTeamIds}
                            setMembersTeam={setMembersTeam}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Private Teams Section */}
                {teams.filter((t) => t.teamVisibility === 'PRIVATE' && !userTeamIds.includes(t.id))
                  .length > 0 && (
                  <div>
                    <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                      🔒 Private Teams
                    </h4>
                    <div className="space-y-2">
                      {teams
                        .filter(
                          (t) => t.teamVisibility === 'PRIVATE' && !userTeamIds.includes(t.id)
                        )
                        .map((team) => (
                          <TeamSidebarCard
                            key={team.id}
                            team={team}
                            department={department}
                            user={user}
                            userTeamIds={userTeamIds}
                            setMembersTeam={setMembersTeam}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Show message if no teams available */}
                {teams.length === 0 && (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No teams in this department yet.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Middle Column - Main Content - Updated to use more space on large screens */}
          <div className="order-2 w-full lg:order-2 lg:min-w-0 lg:flex-1">
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
            <div className="bg-background border-border border-b py-8">
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                  {/* Avatar Section */}
                  <div className="flex flex-shrink-0 justify-center sm:justify-start">
                    <div className="bg-muted border-background flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 shadow-lg dark:border-slate-900">
                      {department.avatarUrl ? (
                        <img
                          src={department.avatarUrl}
                          alt={department.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="text-muted-foreground h-16 w-16" />
                      )}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex flex-1 flex-col justify-center gap-3">
                    <div>
                      <h1 className="text-foreground text-3xl font-bold">{department.name}</h1>
                      {department.description && (
                        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                          {department.description}
                        </p>
                      )}
                      {department.manager && (
                        <p className="text-muted-foreground mt-2 text-xs">
                          Led by{' '}
                          <span className="text-foreground font-medium">
                            {department.manager.firstName} {department.manager.lastName}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {/* Follow / Unfollow */}
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:opacity-60 ${
                          department.isFollowing
                            ? 'border-primary bg-primary/5 text-primary hover:bg-primary/10'
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
                          className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-85"
                        >
                          <Settings className="h-4 w-4" />
                          <span className="hidden sm:inline">Manage Department</span>
                          <span className="sm:hidden">Manage</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Followers modal */}
            <UsersModal
              open={showFollowersModal}
              onOpenChange={setShowFollowersModal}
              title="Followers"
              fetchUsers={async () => {
                const users = await departmentApi.getFollowers(deptId)
                return users.map((u) => ({
                  id: u.id,
                  firstName: u.firstName,
                  lastName: u.lastName,
                  email: u.email,
                  avatar: u.avatar,
                  jobTitle: u.jobTitle,
                }))
              }}
            />

            {/* Create Post and Feed */}
            <div className="space-y-6">
              <CreatePost
                user={user}
                onPostCreate={handlePostCreate}
                departmentId={deptId}
                isMember={isUserDeptMember}
              />
              <div className="space-y-6">
                {postsLoading ? (
                  <div className="flex flex-col items-center gap-4 py-16">
                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                    <p className="text-muted-foreground text-sm">Loading posts…</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mb-4 text-6xl">📝</div>
                    <h2 className="text-foreground mb-2 text-xl font-semibold">No posts yet</h2>
                    <p className="text-muted-foreground">
                      Be the first to share something with your department!
                    </p>
                  </div>
                ) : (
                  <>
                    {posts.map((post, index) => (
                      <div
                        key={post.id}
                        style={{ animation: `slide-up 0.3s ease-out ${index * 50}ms` }}
                      >
                        <PostCard
                          post={post}
                          currentUserId={user.id}
                          usersMap={usersMap}
                          onDelete={handlePostDelete}
                          onUpdate={handlePostUpdate}
                          currentLeadTeamId={null}
                          currentManagedDeptId={
                            hasRole(user, 'CEO') ||
                            (hasRole(user, 'DEPARTMENT_LEADER') && department.managerId === user.id)
                              ? deptId
                              : null
                          }
                        />
                      </div>
                    ))}

                    {/* Infinite scroll sentinel */}
                    {postsHasMore && (
                      <div ref={sentinelRef} className="flex justify-center py-6">
                        {postsLoadingMore && (
                          <div className="flex items-center gap-2">
                            <Loader2 size={18} className="text-muted-foreground animate-spin" />
                            <span className="text-muted-foreground text-sm">
                              Loading more posts…
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Pinned Posts */}
          <div className="order-3 hidden lg:block lg:w-1/5 lg:flex-shrink-0">
            {posts.filter((p) => p.isPinned).length > 0 && (
              <div className="border-border bg-background sticky top-20 rounded-lg border p-4">
                <div className="mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <line x1="12" y1="17" x2="12" y2="22" />
                    <path d="M5 17H19V13L21 8H3L5 13V17Z" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                  </svg>
                  <h3 className="text-foreground text-sm font-semibold">Pinned Posts</h3>
                </div>
                <div className="space-y-3">
                  {posts
                    .filter((p) => p.isPinned)
                    .map((post) => {
                      const author =
                        usersMap[post.authorId] ?? (user?.id === post.authorId ? user : null)
                      return (
                        <div
                          key={post.id}
                          onClick={() => setViewPostId(post.id)}
                          className="border-border hover:bg-muted/40 cursor-pointer rounded-lg border p-3 transition-colors"
                        >
                          <div className="mb-1.5 flex items-center gap-2">
                            <div className="bg-muted h-6 w-6 flex-shrink-0 overflow-hidden rounded-full border">
                              {author && 'avatar' in author && author.avatar ? (
                                <img
                                  src={author.avatar as string}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <span className="text-muted-foreground text-[9px] font-bold">
                                    {author ? (author.firstName?.[0] ?? '?').toUpperCase() : '?'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-foreground truncate text-xs font-medium">
                              {author ? `${author.firstName} ${author.lastName}` : 'Unknown'}
                            </span>
                          </div>
                          <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
                            {post.content}
                          </p>
                          <p className="text-muted-foreground/60 mt-1.5 text-[10px]">
                            {new Date(post.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewPostId && <PostViewModal postId={viewPostId} onClose={() => setViewPostId(null)} />}

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
