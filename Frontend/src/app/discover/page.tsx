'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Users,
  Lock,
  Loader2,
  X,
  UserPlus,
  UserMinus,
  Mail,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  GitBranch,
  Globe,
  ExternalLink,
  Code2,
  Calendar,
  FolderGit2,
  BadgeCheck,
} from 'lucide-react'
import {
  teamApi,
  projectApi,
  userApi,
  TeamResponse,
  ProjectResponse,
  UserTeamResponse,
  UserResponse,
} from '@/lib/api'
import { AuthLayout } from '@/components/auth-layout'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ARCHIVED: 'Archived',
}

const STATUS_COLOR: Record<string, string> = {
  PLANNING: 'bg-slate-500/15 text-slate-400',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400',
  ON_HOLD: 'bg-amber-500/15 text-amber-400',
  COMPLETED: 'bg-green-500/15 text-green-500',
  CANCELLED: 'bg-red-500/15 text-red-400',
  ARCHIVED: 'bg-slate-500/15 text-slate-500',
}

// ── Independent Team Card ─────────────────────────────────────────────────────

interface TeamCardProps {
  team: TeamResponse
  onJoin: (team: TeamResponse) => void
  onLeave: (team: TeamResponse) => void
  onViewMembers: (team: TeamResponse) => void
  joining: boolean
}

function TeamCard({ team, onJoin, onLeave, onViewMembers, joining }: TeamCardProps) {
  const isPrivate = team.teamVisibility !== 'PUBLIC'

  return (
    <div className="bg-background border-border group flex h-full flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
      {/* Banner / Avatar header */}
      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
        {team.bannerUrl && (
          <img src={team.bannerUrl} alt="" className="h-full w-full object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {/* Avatar */}
        <div className="absolute -bottom-5 left-4">
          <div className="border-background bg-muted flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 text-lg font-bold">
            {team.avatarUrl ? (
              <img src={team.avatarUrl} alt={team.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-foreground">{team.name[0]?.toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 px-4 pt-8 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-foreground truncate font-semibold">{team.name}</h3>
            {isPrivate ? (
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <Lock className="h-3 w-3" /> Private
              </div>
            ) : (
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <Globe className="h-3 w-3" /> Public
              </div>
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users className="h-3.5 w-3.5" />
            <span>{team.memberCount}</span>
          </div>
        </div>

        {team.description && (
          <p className="text-muted-foreground line-clamp-2 flex-1 text-sm">{team.description}</p>
        )}

        {team.lead && (
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
              {team.lead.avatar ? (
                <img src={team.lead.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-primary text-[10px] font-bold">{team.lead.firstName[0]}</span>
              )}
            </div>
            <span className="text-muted-foreground text-xs">
              Led by{' '}
              <span className="text-foreground font-medium">
                {team.lead.firstName} {team.lead.lastName}
              </span>
            </span>
          </div>
        )}

        {/* Footer actions */}
        <div className="border-border mt-auto flex items-center justify-between border-t pt-3">
          <button
            onClick={() => onViewMembers(team)}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            View members
          </button>

          {team.isMember ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLeave(team)}
              disabled={joining}
              className="h-7 text-xs"
            >
              {joining ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <UserMinus className="h-3 w-3" />
              )}
              <span className="ml-1">Leave</span>
            </Button>
          ) : isPrivate ? (
            <Button size="sm" variant="ghost" disabled className="h-7 text-xs">
              <Lock className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onJoin(team)}
              disabled={joining}
              className="h-7 text-xs"
            >
              {joining ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <UserPlus className="h-3 w-3" />
              )}
              <span className="ml-1">Join</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Project Card ──────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectResponse }) {
  return (
    <div className="bg-background border-border group flex h-full flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="relative h-20 overflow-hidden bg-gradient-to-br from-indigo-900/60 to-purple-900/60">
        {project.bannerUrl && (
          <img src={project.bannerUrl} alt="" className="h-full w-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[project.status] ?? ''}`}
          >
            {STATUS_LABEL[project.status] ?? project.status}
          </span>
        </div>
        {/* Icon */}
        <div className="absolute -bottom-4 left-4">
          <div className="border-background flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border-2 bg-indigo-900">
            {project.avatarUrl ? (
              <img
                src={project.avatarUrl}
                alt={project.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <FolderGit2 className="h-5 w-5 text-indigo-300" />
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 px-4 pt-7 pb-4">
        <div>
          <h3 className="text-foreground leading-tight font-semibold">{project.name}</h3>
          {project.description && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{project.description}</p>
          )}
        </div>

        {/* Tech stack */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.technologies.slice(0, 5).map((tech) => (
              <span
                key={tech}
                className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 5 && (
              <span className="text-muted-foreground text-[10px]">
                +{project.technologies.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Teams */}
        {project.teams && project.teams.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="text-muted-foreground h-3 w-3 shrink-0" />
            <span className="text-muted-foreground text-xs">
              {project.teams.map((t) => t.name).join(', ')}
            </span>
          </div>
        )}

        {/* Dates */}
        {(project.startDate || project.endDate) && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : '?'}
              {' → '}
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
            </span>
          </div>
        )}

        {/* Links */}
        <div className="border-border mt-auto flex items-center gap-3 border-t pt-3">
          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
            >
              <GitBranch className="h-3.5 w-3.5" />
              Repo
            </a>
          )}
          {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live
            </a>
          )}
          {!project.repositoryUrl && !project.projectUrl && (
            <span className="text-muted-foreground text-xs">No links yet</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── User Card ─────────────────────────────────────────────────────────────────

function UserCard({ user }: { user: UserTeamResponse }) {
  if (!user.user) return null
  const initials = `${user.user.firstName[0]}${user.user.lastName[0]}`.toUpperCase()
  return (
    <div className="bg-background border-border flex h-full flex-col space-y-3 rounded-lg border p-4 text-center">
      <div className="bg-muted text-foreground mx-auto flex h-14 w-14 items-center justify-center rounded-full font-semibold">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-foreground truncate text-sm font-semibold">
          {user.user.firstName} {user.user.lastName}
        </h3>
        {user.user.jobTitle && (
          <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">{user.user.jobTitle}</p>
        )}
      </div>
      {user.user.email && (
        <div className="text-muted-foreground border-border flex items-center justify-center gap-1 border-t pt-3 text-xs">
          <Mail className="h-3 w-3" />
          <span className="truncate">{user.user.email}</span>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ActiveTab = 'teams' | 'projects'
type TeamSortType = 'name' | 'members'
type ProjectSortType = 'name' | 'status'

export default function DiscoverPage() {
  const { user: currentUser } = useAuth()

  const [independentTeams, setIndependentTeams] = useState<TeamResponse[]>([])
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [myTeams, setMyTeams] = useState<TeamResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<ActiveTab>('teams')

  // Team controls
  const [teamSearch, setTeamSearch] = useState('')
  const [teamSort, setTeamSort] = useState<TeamSortType>('name')
  const [joiningTeam, setJoiningTeam] = useState<string | null>(null)

  // Project controls
  const [projectSearch, setProjectSearch] = useState('')
  const [projectSort, setProjectSort] = useState<ProjectSortType>('name')
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('ALL')

  // People carousel
  const [currentUserIndex, setCurrentUserIndex] = useState(0)

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Members modal
  const [membersDialog, setMembersDialog] = useState<{
    open: boolean
    team: TeamResponse | null
    members: UserTeamResponse[]
    loading: boolean
  }>({ open: false, team: null, members: [], loading: false })

  // ── Load ─────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [indTeams, publicProjects, mine, allUsers] = await Promise.all([
        teamApi.getIndependent(),
        projectApi.getPublic(),
        teamApi.getMy(),
        userApi.getAll(),
      ])
      const myIds = new Set(mine.map((t) => t.id))
      setIndependentTeams(indTeams.map((t) => ({ ...t, isMember: myIds.has(t.id) })))
      setProjects(publicProjects)
      setMyTeams(mine)
      setUsers(allUsers.filter((u) => u.id !== currentUser?.id))
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Join / Leave ──────────────────────────────────────────────────────────

  async function handleJoin(team: TeamResponse) {
    setJoiningTeam(team.id)
    try {
      const updated = await teamApi.join(team.id)
      setIndependentTeams((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...updated, isMember: true } : t))
      )
      setMyTeams((prev) => [
        ...prev.filter((t) => t.id !== updated.id),
        { ...updated, isMember: true },
      ])
      showToast(`You joined ${team.name}!`, 'success')
    } catch (e: any) {
      showToast(e.message ?? 'Could not join team', 'error')
    } finally {
      setJoiningTeam(null)
    }
  }

  async function handleLeave(team: TeamResponse) {
    setJoiningTeam(team.id)
    try {
      await teamApi.leave(team.id)
      setIndependentTeams((prev) =>
        prev.map((t) =>
          t.id === team.id
            ? { ...t, isMember: false, memberCount: Math.max(0, t.memberCount - 1) }
            : t
        )
      )
      setMyTeams((prev) => prev.filter((t) => t.id !== team.id))
      showToast(`You left ${team.name}`, 'success')
    } catch (e: any) {
      showToast(e.message ?? 'Could not leave team', 'error')
    } finally {
      setJoiningTeam(null)
    }
  }

  async function handleViewMembers(team: TeamResponse) {
    setMembersDialog({ open: true, team, members: [], loading: true })
    try {
      const members = await teamApi.getMembers(team.id)
      setMembersDialog((prev) => ({ ...prev, members, loading: false }))
    } catch {
      setMembersDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const filteredTeams = independentTeams
    .filter((t) => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
    .sort((a, b) =>
      teamSort === 'members' ? b.memberCount - a.memberCount : a.name.localeCompare(b.name)
    )

  const filteredProjects = projects
    .filter(
      (p) =>
        p.name.toLowerCase().includes(projectSearch.toLowerCase()) &&
        (projectStatusFilter === 'ALL' || p.status === projectStatusFilter)
    )
    .sort((a, b) =>
      projectSort === 'status' ? a.status.localeCompare(b.status) : a.name.localeCompare(b.name)
    )

  const joinedCount = independentTeams.filter((t) => t.isMember).length

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
          <div className="space-y-2">
            <div className="bg-muted h-8 w-48 animate-pulse rounded-xl" />
            <div className="bg-muted h-4 w-72 animate-pulse rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="bg-muted h-20 animate-pulse rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="bg-muted h-52 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AuthLayout>
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
          {/* Error banner */}
          {error && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
              <X className="h-4 w-4 shrink-0" />
              {error}
              <button onClick={loadData} className="ml-auto text-xs underline hover:no-underline">
                Retry
              </button>
            </div>
          )}

          {/* Page header */}
          <div>
            <h1 className="text-foreground text-2xl font-bold">Discover</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Explore independent teams and software projects across the organization.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Users className="h-5 w-5 text-blue-400" />}
              label="Independent Teams"
              value={independentTeams.length}
            />
            <StatCard
              icon={<Code2 className="h-5 w-5 text-indigo-400" />}
              label="Projects"
              value={projects.length}
            />
            {joinedCount > 0 && (
              <StatCard
                icon={<BadgeCheck className="h-5 w-5 text-green-400" />}
                label="Teams Joined"
                value={joinedCount}
              />
            )}
          </div>

          {/* Tab switcher */}
          <div className="border-border flex w-fit gap-1 rounded-xl border p-1">
            <TabBtn active={activeTab === 'teams'} onClick={() => setActiveTab('teams')}>
              <Users className="h-4 w-4" /> Teams
            </TabBtn>
            <TabBtn active={activeTab === 'projects'} onClick={() => setActiveTab('projects')}>
              <FolderGit2 className="h-4 w-4" /> Projects
            </TabBtn>
          </div>

          {/* ── TEAMS TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'teams' && (
            <div className="space-y-5">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-48 flex-1">
                  <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                  <Input
                    placeholder="Search teams…"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={teamSort === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTeamSort('name')}
                  >
                    A–Z
                  </Button>
                  <Button
                    variant={teamSort === 'members' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTeamSort('members')}
                  >
                    Most Members
                  </Button>
                </div>
              </div>

              {filteredTeams.length === 0 ? (
                <Empty
                  icon={<Users className="h-8 w-8" />}
                  title={teamSearch ? 'No teams match your search' : 'No independent teams yet'}
                  subtitle={
                    teamSearch ? '' : 'Teams not assigned to any department will appear here.'
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTeams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      onViewMembers={handleViewMembers}
                      joining={joiningTeam === team.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PROJECTS TAB ──────────────────────────────────────────────── */}
          {activeTab === 'projects' && (
            <div className="space-y-5">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-48 flex-1">
                  <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                  <Input
                    placeholder="Search projects…"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].map((s) => (
                    <Button
                      key={s}
                      variant={projectStatusFilter === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setProjectStatusFilter(s)}
                    >
                      {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
                    </Button>
                  ))}
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <Empty
                  icon={<FolderGit2 className="h-8 w-8" />}
                  title={projectSearch ? 'No projects match your search' : 'No projects yet'}
                  subtitle="Software projects managed by teams will appear here."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PEOPLE YOU MAY KNOW ────────────────────────────────────────── */}
          {users.length > 0 && (
            <div className="border-border mt-12 space-y-4 border-t pt-8">
              <h2 className="text-foreground text-lg font-semibold">People You May Know</h2>
              <div className="relative">
                <div className="overflow-hidden">
                  <div
                    className="flex gap-4 transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${currentUserIndex * 25}%)` }}
                  >
                    {users.map((user) => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.id}`}
                        className="w-1/4 flex-shrink-0"
                      >
                        <div className="bg-background border-border hover:border-border/80 flex h-full cursor-pointer flex-col space-y-4 rounded-lg border p-4 transition-all duration-200 hover:shadow-md">
                          <div className="flex justify-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="border-border h-16 w-16 rounded-full border object-cover"
                              />
                            ) : (
                              <div className="bg-muted text-foreground flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold">
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1 text-center">
                            <h3 className="text-foreground hover:text-primary line-clamp-1 text-sm font-semibold">
                              {user.firstName} {user.lastName}
                            </h3>
                            {user.jobTitle && (
                              <p className="text-muted-foreground line-clamp-1 text-xs">
                                {user.jobTitle}
                              </p>
                            )}
                          </div>
                          {user.bio && (
                            <p className="text-muted-foreground line-clamp-2 text-center text-xs">
                              {user.bio}
                            </p>
                          )}
                          <div className="border-border border-t pt-3">
                            <a
                              href={`mailto:${user.email}`}
                              onClick={(e) => e.preventDefault()}
                              className="text-primary flex items-center justify-center gap-1 truncate text-xs hover:underline"
                              title={user.email}
                            >
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </a>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                {users.length > 4 && (
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button
                      onClick={() =>
                        setCurrentUserIndex((i) => (i - 1 + users.length) % users.length)
                      }
                      className="bg-background border-border hover:bg-muted text-foreground rounded-full border p-2 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentUserIndex((i) => (i + 1) % users.length)}
                      className="bg-background border-border hover:bg-muted text-foreground rounded-full border p-2 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Members Dialog */}
        <Dialog
          open={membersDialog.open}
          onOpenChange={(open) => !open && setMembersDialog((p) => ({ ...p, open: false }))}
        >
          <DialogContent className="flex max-h-[80vh] flex-col rounded-lg sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{membersDialog.team?.name} Members</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto py-4">
              {membersDialog.loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
              ) : membersDialog.members.length === 0 ? (
                <p className="text-muted-foreground py-10 text-center text-sm">No members yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {membersDialog.members.map((m) => (
                    <div key={m.id}>{m.user ? <UserCard user={m} /> : null}</div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Toast */}
        {toast && (
          <div
            className={`animate-slide-up fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-background text-foreground border-border'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <X className="h-4 w-4 shrink-0" />
            )}
            {toast.msg}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

// ── Micro-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-muted/50 border-border flex items-center gap-3 rounded-xl border px-4 py-3">
      {icon}
      <div>
        <p className="text-foreground text-xl leading-none font-bold">{value}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
      </div>
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  )
}

function Empty({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-muted text-muted-foreground mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        {icon}
      </div>
      <p className="text-foreground font-semibold">{title}</p>
      {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
    </div>
  )
}
