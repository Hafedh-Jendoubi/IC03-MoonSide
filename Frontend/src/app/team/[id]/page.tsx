'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  Users,
  X,
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
  Trash2,
  MoreVertical,
  Crown,
  LogOut,
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
  teamApi,
  departmentApi,
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

// ── helpers ───────────────────────────────────────────────────────────────────

function canManageTeam(
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

function canAssignMember(
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

// ── Manage Team Panel ─────────────────────────────────────────────────────────

type ManageSection = 'general' | 'members' | 'settings'

interface ManageTeamPanelProps {
  team: TeamResponse
  canKick: boolean
  user: User
  onClose: () => void
  onSaved: (updated: TeamResponse) => void
  onMemberChange: (delta: number) => void
  onDeleted: () => void
}

function ManageTeamPanel({
  team,
  canKick,
  user,
  onClose,
  onSaved,
  onMemberChange,
  onDeleted,
}: ManageTeamPanelProps) {
  const [section, setSection] = useState<ManageSection>('general')

  const navItems: { id: ManageSection; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <div className="bg-background fixed inset-0 z-50 flex">
      {/* Left Sidebar */}
      <aside className="bg-muted/30 flex w-60 flex-shrink-0 flex-col border-r">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border">
            {team.avatarUrl ? (
              <img src={team.avatarUrl} alt={team.name} className="h-full w-full object-cover" />
            ) : (
              <Users className="text-muted-foreground h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground mb-0.5 text-xs leading-none font-medium tracking-wide uppercase">
              Team
            </p>
            <p className="text-foreground truncate text-sm font-semibold">{team.name}</p>
          </div>
        </div>

        {/* Nav */}
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

        {/* Back button */}
        <div className="border-t px-3 py-4">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-background/60 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          {section === 'general' && <GeneralSection team={team} user={user} onSaved={onSaved} />}
          {section === 'members' && (
            <MembersSection team={team} canKick={canKick} onMemberChange={onMemberChange} />
          )}
          {section === 'settings' && (
            <SettingsSection team={team} onSaved={onSaved} onDeleted={onDeleted} />
          )}
        </div>
      </main>
    </div>
  )
}

// ── General Section ───────────────────────────────────────────────────────────

function GeneralSection({
  team,
  user,
  onSaved,
}: {
  team: TeamResponse
  user: User
  onSaved: (t: TeamResponse) => void
}) {
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description ?? '')
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null | undefined>(undefined)
  const [pendingBannerUrl, setPendingBannerUrl] = useState<string | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState(false)
  const [assigningSelf, setAssigningSelf] = useState(false)

  const isDeptLeader = hasRole(user, 'DEPARTMENT_LEADER')
  const isAlreadyLead = team.leadId === user.id

  const handleAssignSelfAsLeader = async () => {
    setAssigningSelf(true)
    setError(null)
    try {
      const updated = await teamApi.assignLead(team.id, user.id)
      onSaved(updated)
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 3000)
    } catch (e: any) {
      setError(e.message ?? 'Failed to assign team leader')
    } finally {
      setAssigningSelf(false)
    }
  }

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
        teamVisibility: team.teamVisibility as 'PUBLIC' | 'PRIVATE',
      })
      if (pendingAvatarUrl !== undefined)
        result = await teamApi.updateAvatar(team.id, pendingAvatarUrl)
      if (pendingBannerUrl !== undefined)
        result = await teamApi.updateBanner(team.id, pendingBannerUrl)
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
          Manage your team's profile and appearance.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Changes saved successfully.
        </div>
      )}

      {/* Self-assign as leader — Department Leader only */}
      {isDeptLeader && !isAlreadyLead && (
        <div className="bg-muted/30 flex items-center justify-between gap-4 rounded-xl border p-4">
          <div className="min-w-0">
            <p className="text-foreground text-sm font-medium">Take leadership of this team</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Assign yourself as Team Leader. You will be added as a member automatically.
            </p>
          </div>
          <button
            onClick={handleAssignSelfAsLeader}
            disabled={assigningSelf}
            className="bg-primary text-primary-foreground flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {assigningSelf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {assigningSelf ? 'Assigning…' : 'Set as Leader'}
          </button>
        </div>
      )}

      {isDeptLeader && isAlreadyLead && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
          <Shield className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            You are the Team Leader of this team.
          </p>
        </div>
      )}

      {/* Banner */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="text-muted-foreground h-4 w-4" />
          <label className="text-foreground text-sm font-medium">Banner Image</label>
        </div>
        <OrgBannerUpload
          currentUrl={displayBanner}
          onUploaded={setPendingBannerUrl}
          context="TEAM_BANNER"
          disabled={saving}
        />
      </div>

      {/* Avatar + Name */}
      <div className="flex items-end gap-5">
        <div className="flex-shrink-0">
          <label className="text-foreground mb-2 block text-sm font-medium">Team Avatar</label>
          <OrgAvatarUpload
            currentUrl={displayAvatar}
            onUploaded={setPendingAvatarUrl}
            context="TEAM_AVATAR"
            label="Change avatar"
            disabled={saving}
          />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Type className="text-muted-foreground h-4 w-4" />
            <label className="text-foreground text-sm font-medium">Team Name</label>
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

      {/* Description */}
      <div className="space-y-2">
        <label className="text-foreground text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={4}
          disabled={saving}
          placeholder="What does this team do?"
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

// ── Members Section ───────────────────────────────────────────────────────────

function MembersSection({
  team,
  canKick,
  onMemberChange,
}: {
  team: TeamResponse
  canKick: boolean
  onMemberChange: (delta: number) => void
}) {
  const [members, setMembers] = useState<UserTeamResponse[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [kickingId, setKickingId] = useState<string | null>(null)
  const [confirmKick, setConfirmKick] = useState<UserTeamResponse | null>(null)
  const [promotingId, setPromotingId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'promote' | 'kick'
    member: UserTeamResponse
  } | null>(null)

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserResponse[]>([])
  const [searching, setSearching] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLoadingMembers(true)
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
    } catch (e: any) {
      setMembersError(e.message ?? 'Failed to promote member')
    } finally {
      setPromotingId(null)
    }
  }

  const currentMemberIds = new Set(members.map((m) => m.userId))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Members</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {members.length} member{members.length !== 1 ? 's' : ''} in this team.
        </p>
      </div>

      {/* Add Member — Search */}
      {canKick && (
        <div className="bg-muted/20 space-y-3 rounded-xl border p-5">
          <div className="flex items-center gap-2">
            <UserPlus className="text-primary h-4 w-4" />
            <h2 className="text-foreground text-sm font-semibold">Add a Member</h2>
          </div>
          <p className="text-muted-foreground text-xs">
            Search by name, email, or job title to find and add employees.
          </p>

          {assignError && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-3 py-2 text-xs">
              {assignError}
            </div>
          )}

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employees by name, email, or role…"
              className="bg-background focus:ring-primary w-full rounded-lg border py-2 pr-4 pl-9 text-sm focus:ring-2 focus:outline-none"
            />
            {searching && (
              <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
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
                    className="hover:bg-muted/40 flex items-center justify-between px-4 py-2.5 transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="bg-muted h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={`${u.firstName} ${u.lastName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-muted-foreground text-xs font-semibold">
                              {u.firstName[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground text-sm leading-tight font-medium">
                          {u.firstName} {u.lastName}
                        </p>
                        {u.jobTitle && (
                          <p className="text-muted-foreground truncate text-xs">{u.jobTitle}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssign(u)}
                      disabled={isAssigning || alreadyMember}
                      className="bg-primary/10 text-primary hover:bg-primary/20 ml-3 flex flex-shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isAssigning ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : alreadyMember ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      {alreadyMember ? 'Member' : 'Add'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {query.trim() && !searching && searchResults.length === 0 && (
            <p className="text-muted-foreground py-3 text-center text-xs">
              No employees found matching &quot;{query}&quot;
            </p>
          )}
        </div>
      )}

      {/* Current Members */}
      <div className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Current Members</h2>

        {membersError && (
          <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
            {membersError}
          </div>
        )}

        {loadingMembers && (
          <div className="flex justify-center py-8">
            <Loader2 className="text-primary h-7 w-7 animate-spin" />
          </div>
        )}

        {!loadingMembers && !membersError && members.length === 0 && (
          <div className="rounded-xl border border-dashed py-10 text-center">
            <Users className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">No members yet.</p>
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
      </div>

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

// ── Settings Section ──────────────────────────────────────────────────────────

function SettingsSection({
  team,
  onSaved,
  onDeleted,
}: {
  team: TeamResponse
  onSaved: (t: TeamResponse) => void
  onDeleted: () => void
}) {
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(
    team.teamVisibility as 'PUBLIC' | 'PRIVATE'
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const result = await teamApi.update(team.id, {
        name: team.name,
        description: team.description ?? '',
        departmentId: team.departmentId,
        leadId: team.leadId ?? undefined,
        teamVisibility: visibility,
      })
      onSaved(result)
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 3000)
    } catch (e: any) {
      setError(e.message ?? 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setConfirmDelete(false)
    setDeleting(true)
    try {
      await teamApi.delete(team.id)
      onDeleted()
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete team')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure team visibility and access control.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" /> Settings saved.
        </div>
      )}

      <div className="divide-y rounded-xl border">
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Eye className="text-muted-foreground h-4 w-4" />
            <h2 className="text-foreground text-sm font-semibold">Visibility</h2>
          </div>
          <p className="text-muted-foreground text-xs">Control who can see and join this team.</p>
          <div className="space-y-2">
            {(['PUBLIC', 'PRIVATE'] as const).map((v) => (
              <label
                key={v}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                  visibility === v ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={visibility === v}
                  onChange={() => setVisibility(v)}
                  className="accent-primary mt-0.5"
                />
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {v === 'PUBLIC' ? 'Public' : 'Private'}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {v === 'PUBLIC'
                      ? 'Anyone in the organisation can find and join this team.'
                      : 'Only invited members can join this team.'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 dark:border-red-900">
        <div className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <Trash2 className="text-destructive h-4 w-4" />
            <h2 className="text-destructive text-sm font-semibold">Danger Zone</h2>
          </div>
          <p className="text-muted-foreground mb-4 text-xs">
            Permanently delete this team. This action cannot be undone.
          </p>
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleting ? 'Deleting…' : 'Delete Team'}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background w-full max-w-sm rounded-xl border p-6 shadow-xl">
            <h3 className="text-foreground mb-2 text-base font-semibold">Delete Team</h3>
            <p className="text-muted-foreground mb-5 text-sm">
              Are you sure you want to delete{' '}
              <span className="text-foreground font-medium">{team.name}</span>? This action cannot
              be undone and all members will be removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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

// ── Team Members Modal (view-only) ────────────────────────────────────────────

interface TeamMembersModalProps {
  team: TeamResponse
  onClose: () => void
}

function TeamMembersModal({ team, onClose }: TeamMembersModalProps) {
  const [members, setMembers] = useState<UserTeamResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    teamApi
      .getMembers(team.id)
      .then(setMembers)
      .catch((e: any) => setError(e.message ?? 'Failed to load members'))
      .finally(() => setLoading(false))
  }, [team.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background w-full max-w-md rounded-xl shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-5 w-5" />
            <h2 className="text-foreground text-lg font-semibold">
              Members{' '}
              <span className="text-muted-foreground ml-1 text-base font-normal">
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
                return (
                  <li key={member.id}>
                    <Link
                      href={`/profile/${member.userId}`}
                      onClick={onClose}
                      className="hover:bg-muted/40 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
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
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamFeedPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const teamId = params?.id as string

  const [team, setTeam] = useState<TeamResponse | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [usersMap] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userManagedDeptIds, setUserManagedDeptIds] = useState<string[]>([])
  const [manageOpen, setManageOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

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

  const showManageButton =
    canManageTeam(user, team, userManagedDeptIds) || canAssignMember(user, team, userManagedDeptIds)
  const canKick = canManageTeam(user, team, userManagedDeptIds)

  const handleFollow = async () => {
    if (!team) return
    setFollowLoading(true)
    try {
      const updated = team.isFollowing
        ? await teamApi.unfollow(team.id)
        : await teamApi.follow(team.id)
      setTeam(updated)
    } catch {
      /* silently ignore */
    } finally {
      setFollowLoading(false)
    }
  }

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

        {/* Team Header */}
        <div className="bg-background mb-8 flex items-end gap-6 px-2">
          <div className="relative -mt-14 flex-shrink-0">
            <div className="bg-muted flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-lg dark:border-slate-800">
              {team.avatarUrl ? (
                <img src={team.avatarUrl} alt={team.name} className="h-full w-full object-cover" />
              ) : (
                <Users className="text-foreground h-14 w-14" />
              )}
            </div>
          </div>

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
              <button
                onClick={() => setMembersOpen(true)}
                className="text-muted-foreground hover:text-primary mt-1 flex items-center gap-1.5 text-xs transition-colors hover:underline"
                title="View members"
              >
                <Users className="h-3.5 w-3.5" />
                {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                  team.isFollowing
                    ? 'border-primary text-primary hover:bg-primary/10'
                    : 'border-border text-foreground hover:bg-muted'
                }`}
              >
                {followLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : team.isFollowing ? (
                  <BellOff className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {team.isFollowing ? 'Following' : 'Follow'}
                {team.followerCount > 0 && (
                  <span className="text-muted-foreground text-xs">({team.followerCount})</span>
                )}
              </button>

              {showManageButton && (
                <button
                  onClick={() => setManageOpen(true)}
                  className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                >
                  <Settings className="h-4 w-4" />
                  Manage Team
                </button>
              )}
            </div>
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

      {manageOpen && (
        <ManageTeamPanel
          team={team}
          canKick={canKick}
          user={user}
          onClose={() => setManageOpen(false)}
          onSaved={(updated) => setTeam(updated)}
          onMemberChange={(delta) =>
            setTeam((prev) =>
              prev ? { ...prev, memberCount: Math.max(0, prev.memberCount + delta) } : prev
            )
          }
          onDeleted={() => router.push(`/department/${team.departmentId}`)}
        />
      )}

      {membersOpen && <TeamMembersModal team={team} onClose={() => setMembersOpen(false)} />}
    </AuthLayout>
  )
}
