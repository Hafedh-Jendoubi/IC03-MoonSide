'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Building2,
  Users,
  Search,
  Globe,
  Lock,
  Crown,
  UserPlus,
  UserMinus,
  Loader2,
  X,
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import {
  departmentApi,
  teamApi,
  DepartmentResponse,
  TeamResponse,
  UserTeamResponse,
} from '@/lib/api'
import { AuthLayout } from '@/components/auth-layout'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InitialAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim =
    size === 'sm' ? 'h-7 w-7 text-xs' : size === 'md' ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-base'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div
      className={`${dim} bg-primary/10 text-primary flex flex-shrink-0 items-center justify-center rounded-full font-semibold`}
    >
      {initials}
    </div>
  )
}

// Department colour palette — cycles through a set of accent colours
const DEPT_COLORS = [
  {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-500',
    border: 'border-blue-500/20',
    pill: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    bg: 'bg-violet-500/10',
    icon: 'text-violet-500',
    border: 'border-violet-500/20',
    pill: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-500',
    border: 'border-emerald-500/20',
    pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-500',
    border: 'border-amber-500/20',
    pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    bg: 'bg-rose-500/10',
    icon: 'text-rose-500',
    border: 'border-rose-500/20',
    pill: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  {
    bg: 'bg-cyan-500/10',
    icon: 'text-cyan-500',
    border: 'border-cyan-500/20',
    pill: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  },
]

// ─── Team Card ────────────────────────────────────────────────────────────────

interface TeamCardProps {
  team: TeamResponse
  onJoin: (team: TeamResponse) => void
  onLeave: (team: TeamResponse) => void
  onViewMembers: (team: TeamResponse) => void
  joining: boolean
  accentColor: (typeof DEPT_COLORS)[0]
}

function TeamCard({ team, onJoin, onLeave, onViewMembers, joining, accentColor }: TeamCardProps) {
  const isPrivate = team.teamVisibility !== 'PUBLIC'
  return (
    <div
      className={`group bg-card relative flex flex-col rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        team.isMember
          ? 'border-primary/25 ring-primary/10 ring-1'
          : 'border-border hover:border-border/80'
      }`}
    >
      {/* Member ribbon */}
      {team.isMember && (
        <span className="bg-primary/10 text-primary absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
          <CheckCircle2 className="h-3 w-3" /> Joined
        </span>
      )}

      {/* Top row: avatar + meta */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {team.image ? (
            <img src={team.image} alt={team.name} className="h-11 w-11 rounded-xl object-cover" />
          ) : (
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentColor.bg}`}
            >
              <Users className={`h-5 w-5 ${accentColor.icon}`} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pr-12">
          <h3 className="text-foreground truncate leading-tight font-semibold">{team.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                isPrivate ? 'bg-muted text-muted-foreground' : accentColor.pill
              }`}
            >
              {isPrivate ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
              {isPrivate ? 'Private' : 'Public'}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {team.description && (
        <p className="text-muted-foreground mt-3 line-clamp-2 text-xs leading-relaxed">
          {team.description}
        </p>
      )}

      {/* Footer: lead + count + action */}
      <div className="mt-4 flex items-center gap-2">
        {team.lead && (
          <span className="text-muted-foreground flex flex-1 items-center gap-1 truncate text-xs">
            <Crown className="h-3 w-3 flex-shrink-0 text-amber-500" />
            <span className="truncate">
              {team.lead.firstName} {team.lead.lastName}
            </span>
          </span>
        )}
        {!team.lead && <span className="flex-1" />}

        <button
          onClick={() => onViewMembers(team)}
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors"
        >
          <Users className="h-3 w-3" />
          {team.memberCount}
        </button>

        {team.isMember ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onLeave(team)}
            disabled={joining}
            className="border-destructive/30 text-destructive hover:border-destructive/60 hover:bg-destructive/10 h-7 rounded-full px-3 text-xs"
          >
            {joining ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <UserMinus className="h-3 w-3" />
            )}
            <span className="ml-1">Leave</span>
          </Button>
        ) : isPrivate ? (
          <Button
            size="sm"
            variant="ghost"
            disabled
            className="text-muted-foreground h-7 rounded-full px-3 text-xs"
          >
            <Lock className="h-3 w-3" />
            <span className="ml-1">Private</span>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onJoin(team)}
            disabled={joining}
            className="h-7 rounded-full px-3 text-xs"
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
  )
}

// ─── Department Section ───────────────────────────────────────────────────────

interface DeptSectionProps {
  dept: DepartmentResponse
  teams: TeamResponse[]
  colorIndex: number
  onJoin: (team: TeamResponse) => void
  onLeave: (team: TeamResponse) => void
  onViewMembers: (team: TeamResponse) => void
  joiningTeam: string | null
}

function DeptSection({
  dept,
  teams,
  colorIndex,
  onJoin,
  onLeave,
  onViewMembers,
  joiningTeam,
}: DeptSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const color = DEPT_COLORS[colorIndex % DEPT_COLORS.length]
  if (teams.length === 0) return null
  return (
    <div className="space-y-3">
      {/* Dept header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="hover:bg-muted/50 flex w-full items-center gap-3 rounded-xl px-1 py-1 transition-colors"
      >
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${color.bg}`}
        >
          <Building2 className={`h-4 w-4 ${color.icon}`} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-semibold">{dept.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${color.pill}`}>
              {teams.length} team{teams.length !== 1 ? 's' : ''}
            </span>
          </div>
          {dept.description && (
            <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{dept.description}</p>
          )}
          {dept.manager && !dept.description && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              Managed by {dept.manager.firstName} {dept.manager.lastName}
            </p>
          )}
        </div>
        <div className="text-muted-foreground flex-shrink-0">
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </button>

      {/* Team grid */}
      {!collapsed && (
        <div className="animate-fade-in grid gap-3 pl-1 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              accentColor={color}
              onJoin={onJoin}
              onLeave={onLeave}
              onViewMembers={onViewMembers}
              joining={joiningTeam === team.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  icon: Icon,
  colorClass,
}: {
  value: number
  label: string
  icon: React.ElementType
  colorClass: string
}) {
  return (
    <div className="border-border bg-card flex items-center gap-3 rounded-2xl border px-5 py-4">
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${colorClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-foreground text-2xl leading-none font-bold">{value}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [myTeams, setMyTeams] = useState<TeamResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TeamResponse[] | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Active tab
  const [tab, setTab] = useState<'all' | 'my-teams'>('all')

  // Dept filter pill
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null)

  // Join/leave loading
  const [joiningTeam, setJoiningTeam] = useState<string | null>(null)

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Members modal
  const [membersDialog, setMembersDialog] = useState<{
    open: boolean
    team: TeamResponse | null
    members: UserTeamResponse[]
    loading: boolean
  }>({ open: false, team: null, members: [], loading: false })

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [depts, publicTeams, mine] = await Promise.all([
        departmentApi.getActive(),
        teamApi.getPublic(),
        teamApi.getMy(),
      ])
      // Merge isMember flag
      const myIds = new Set(mine.map((t) => t.id))
      const merged = publicTeams.map((t) => ({ ...t, isMember: myIds.has(t.id) }))
      setDepartments(depts)
      setTeams(merged)
      setMyTeams(mine)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Toast ─────────────────────────────────────────────────────────────────

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Search ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await teamApi.search(searchQuery)
        const myIds = new Set(myTeams.map((t) => t.id))
        setSearchResults(results.map((t) => ({ ...t, isMember: myIds.has(t.id) })))
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
  }, [searchQuery, myTeams])

  // ── Join / Leave ──────────────────────────────────────────────────────────

  async function handleJoin(team: TeamResponse) {
    setJoiningTeam(team.id)
    try {
      const updated = await teamApi.join(team.id)
      const patch = (list: TeamResponse[]) =>
        list.map((t) => (t.id === updated.id ? { ...updated, isMember: true } : t))
      setTeams(patch)
      setSearchResults((prev) => (prev ? patch(prev) : null))
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
      const patch = (list: TeamResponse[]) =>
        list.map((t) =>
          t.id === team.id
            ? { ...t, isMember: false, memberCount: Math.max(0, t.memberCount - 1) }
            : t
        )
      setTeams(patch)
      setSearchResults((prev) => (prev ? patch(prev) : null))
      setMyTeams((prev) => prev.filter((t) => t.id !== team.id))
      showToast(`You left ${team.name}`, 'success')
    } catch (e: any) {
      showToast(e.message ?? 'Could not leave team', 'error')
    } finally {
      setJoiningTeam(null)
    }
  }

  // ── Members modal ─────────────────────────────────────────────────────────

  async function handleViewMembers(team: TeamResponse) {
    setMembersDialog({ open: true, team, members: [], loading: true })
    try {
      const members = await teamApi.getMembers(team.id)
      setMembersDialog((prev) => ({ ...prev, members, loading: false }))
    } catch {
      setMembersDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  // ── Derived lists ─────────────────────────────────────────────────────────

  const displayedInSearch = (() => {
    const base = searchResults ?? []
    if (activeDeptId) return base.filter((t) => t.departmentId === activeDeptId)
    return base
  })()

  const filteredByDept = activeDeptId ? teams.filter((t) => t.departmentId === activeDeptId) : teams

  const joinedCount = teams.filter((t) => t.isMember).length

  // ── Skeleton ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="bg-muted h-8 w-48 animate-pulse rounded-xl" />
            <div className="bg-muted h-4 w-72 animate-pulse rounded-lg" />
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-muted h-20 animate-pulse rounded-2xl" />
            ))}
          </div>
          {/* Cards */}
          <div className="space-y-6">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-3">
                <div className="bg-muted h-10 w-56 animate-pulse rounded-xl" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="bg-muted h-40 animate-pulse rounded-2xl" />
                  ))}
                </div>
              </div>
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
        <div className="mx-auto max-w-6xl space-y-7 px-4 py-10">
          {/* ── Page Header ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-2xl">
                <Compass className="text-primary h-5 w-5" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold tracking-tight">Discover</h1>
                <p className="text-muted-foreground text-sm">
                  Explore departments and join the teams that interest you
                </p>
              </div>
            </div>
          </div>

          {/* ── Error banner ──────────────────────────────────────────────── */}
          {error && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
              <X className="h-4 w-4 flex-shrink-0" />
              {error}
              <button
                onClick={loadData}
                className="ml-auto text-xs underline underline-offset-2 hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Stats ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <StatCard
              value={departments.length}
              label="Departments"
              icon={Building2}
              colorClass="bg-blue-500/10 text-blue-500"
            />
            <StatCard
              value={teams.length}
              label="Public Teams"
              icon={Globe}
              colorClass="bg-violet-500/10 text-violet-500"
            />
            <StatCard
              value={joinedCount}
              label="Teams Joined"
              icon={CheckCircle2}
              colorClass="bg-emerald-500/10 text-emerald-500"
            />
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="border-border flex gap-1 border-b">
            {(
              [
                ['all', 'Discover', Sparkles],
                ['my-teams', 'My Teams', Users],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key as 'all' | 'my-teams')}
                className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === key
                    ? 'border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {key === 'my-teams' && myTeams.length > 0 && (
                  <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    {myTeams.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DISCOVER TAB                                                   */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {tab === 'all' && (
            <div className="space-y-6">
              {/* Search + dept filter row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search teams…"
                    className="bg-muted/50 focus:border-border focus:bg-background rounded-xl border-transparent pr-9 pl-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Department filter pills */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveDeptId(null)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeDeptId === null
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  All
                </button>
                {departments.map((dept, i) => {
                  const color = DEPT_COLORS[i % DEPT_COLORS.length]
                  return (
                    <button
                      key={dept.id}
                      onClick={() => setActiveDeptId(dept.id === activeDeptId ? null : dept.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        activeDeptId === dept.id
                          ? `border-primary bg-primary text-primary-foreground`
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      <Building2 className="h-3 w-3" />
                      {dept.name}
                      <span
                        className={`rounded-full px-1 font-semibold ${activeDeptId === dept.id ? 'opacity-70' : 'opacity-50'}`}
                      >
                        {dept.teamCount}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* ── Search Results ──────────────────────────────────────── */}
              {searchQuery && (
                <>
                  {searching && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                    </div>
                  )}
                  {!searching && searchResults !== null && (
                    <>
                      <p className="text-muted-foreground text-sm">
                        {displayedInSearch.length === 0
                          ? 'No teams found.'
                          : `${displayedInSearch.length} team${displayedInSearch.length !== 1 ? 's' : ''} found`}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {displayedInSearch.map((team) => {
                          const deptIdx = departments.findIndex((d) => d.id === team.departmentId)
                          return (
                            <TeamCard
                              key={team.id}
                              team={team}
                              accentColor={
                                DEPT_COLORS[(deptIdx >= 0 ? deptIdx : 0) % DEPT_COLORS.length]
                              }
                              onJoin={handleJoin}
                              onLeave={handleLeave}
                              onViewMembers={handleViewMembers}
                              joining={joiningTeam === team.id}
                            />
                          )
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── Department-filtered flat list ───────────────────────── */}
              {!searchQuery && activeDeptId && (
                <div className="animate-fade-in grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredByDept.length === 0 ? (
                    <p className="text-muted-foreground col-span-3 py-10 text-center text-sm">
                      No public teams in this department yet.
                    </p>
                  ) : (
                    filteredByDept.map((team) => {
                      const deptIdx = departments.findIndex((d) => d.id === activeDeptId)
                      return (
                        <TeamCard
                          key={team.id}
                          team={team}
                          accentColor={DEPT_COLORS[deptIdx % DEPT_COLORS.length]}
                          onJoin={handleJoin}
                          onLeave={handleLeave}
                          onViewMembers={handleViewMembers}
                          joining={joiningTeam === team.id}
                        />
                      )
                    })
                  )}
                </div>
              )}

              {/* ── All departments grouped ─────────────────────────────── */}
              {!searchQuery && !activeDeptId && (
                <div className="space-y-8">
                  {departments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                        <Building2 className="text-muted-foreground h-8 w-8" />
                      </div>
                      <p className="font-semibold">No departments yet</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Check back once your admin sets up the organization structure.
                      </p>
                    </div>
                  )}
                  {departments.map((dept, i) => (
                    <DeptSection
                      key={dept.id}
                      dept={dept}
                      teams={teams.filter((t) => t.departmentId === dept.id)}
                      colorIndex={i}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      onViewMembers={handleViewMembers}
                      joiningTeam={joiningTeam}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MY TEAMS TAB                                                   */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {tab === 'my-teams' && (
            <div className="space-y-4">
              {myTeams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                    <Users className="text-muted-foreground h-8 w-8" />
                  </div>
                  <h3 className="font-semibold">You haven't joined any teams yet</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Head to Discover to browse public teams and join ones that interest you.
                  </p>
                  <Button className="mt-5 rounded-full" onClick={() => setTab('all')}>
                    <Sparkles className="mr-2 h-4 w-4" /> Discover Teams
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {myTeams.map((team) => {
                    const deptIdx = departments.findIndex((d) => d.id === team.departmentId)
                    return (
                      <TeamCard
                        key={team.id}
                        team={team}
                        accentColor={DEPT_COLORS[(deptIdx >= 0 ? deptIdx : 0) % DEPT_COLORS.length]}
                        onJoin={handleJoin}
                        onLeave={handleLeave}
                        onViewMembers={handleViewMembers}
                        joining={joiningTeam === team.id}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Members Dialog ──────────────────────────────────────────────────── */}
        <Dialog
          open={membersDialog.open}
          onOpenChange={(open) => !open && setMembersDialog((prev) => ({ ...prev, open: false }))}
        >
          <DialogContent className="flex max-h-[80vh] flex-col rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="text-primary h-5 w-5" />
                {membersDialog.team?.name}
              </DialogTitle>
              <DialogDescription>
                {membersDialog.team?.memberCount} member
                {membersDialog.team?.memberCount !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto py-2">
              {membersDialog.loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
              ) : membersDialog.members.length === 0 ? (
                <p className="text-muted-foreground py-10 text-center text-sm">No members yet.</p>
              ) : (
                membersDialog.members.map((m) => (
                  <div
                    key={m.id}
                    className="hover:bg-muted/50 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
                  >
                    {m.user ? (
                      m.user.avatar ? (
                        <img
                          src={m.user.avatar}
                          alt=""
                          className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <InitialAvatar name={`${m.user.firstName} ${m.user.lastName}`} size="md" />
                      )
                    ) : (
                      <div className="bg-muted h-9 w-9 flex-shrink-0 rounded-full" />
                    )}
                    <div className="min-w-0 flex-1">
                      {m.user ? (
                        <>
                          <p className="truncate text-sm font-medium">
                            {m.user.firstName} {m.user.lastName}
                            {membersDialog.team?.leadId === m.userId && (
                              <Crown className="ml-1.5 inline h-3.5 w-3.5 text-amber-500" />
                            )}
                          </p>
                          {m.user.jobTitle && (
                            <p className="text-muted-foreground truncate text-xs">
                              {m.user.jobTitle}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground text-sm">Unknown user</p>
                      )}
                    </div>
                    <p className="text-muted-foreground flex-shrink-0 text-xs">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Toast notification ──────────────────────────────────────────────── */}
        {toast && (
          <div
            className={`animate-slide-up fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-foreground text-background'
                : 'bg-destructive text-destructive-foreground'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 flex-shrink-0" />
            )}
            {toast.msg}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
