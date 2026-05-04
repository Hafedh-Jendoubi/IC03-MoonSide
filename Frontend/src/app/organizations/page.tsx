'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  RefreshCw,
  ChevronRight,
  X,
} from 'lucide-react'
import {
  departmentApi,
  teamApi,
  DepartmentResponse,
  TeamResponse,
  UserTeamResponse,
} from '@/lib/api'

// --- Avatar -------------------------------------------------------------------

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

// --- Team card ----------------------------------------------------------------

interface TeamCardProps {
  team: TeamResponse
  onJoin: (team: TeamResponse) => void
  onLeave: (team: TeamResponse) => void
  onViewMembers: (team: TeamResponse) => void
  joining: boolean
}

function TeamCard({ team, onJoin, onLeave, onViewMembers, joining }: TeamCardProps) {
  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Team image / icon */}
          <div className="flex-shrink-0">
            {team.avatarUrl ? (
              <img
                src={team.avatarUrl}
                alt={team.name}
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                <Users className="h-6 w-6 text-violet-500" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Name + visibility */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-foreground truncate font-semibold">{team.name}</h3>
              <Badge
                variant={team.teamVisibility === 'PUBLIC' ? 'secondary' : 'outline'}
                className="flex-shrink-0 text-xs"
              >
                {team.teamVisibility === 'PUBLIC' ? (
                  <>
                    <Globe className="mr-1 h-3 w-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Private
                  </>
                )}
              </Badge>
            </div>

            {/* Department */}
            {team.departmentName && (
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <Building2 className="h-3 w-3" /> {team.departmentName}
              </p>
            )}

            {/* Description */}
            {team.description && (
              <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">
                {team.description}
              </p>
            )}

            {/* Lead + member count */}
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              {team.lead && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Crown className="h-3 w-3 text-amber-500" />
                  {team.lead.firstName} {team.lead.lastName}
                </span>
              )}
              <button
                onClick={() => onViewMembers(team)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
              >
                <Users className="h-3 w-3" />
                {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
              </button>
            </div>
          </div>

          {/* Join / Leave button */}
          <div className="flex-shrink-0">
            {team.isMember ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLeave(team)}
                disabled={joining}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/60"
              >
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserMinus className="h-4 w-4" />
                )}
                <span className="ml-1.5 hidden sm:inline">Leave</span>
              </Button>
            ) : team.teamVisibility === 'PUBLIC' ? (
              <Button size="sm" onClick={() => onJoin(team)} disabled={joining}>
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span className="ml-1.5 hidden sm:inline">Join</span>
              </Button>
            ) : (
              <Button size="sm" variant="ghost" disabled className="text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="ml-1.5 hidden sm:inline">Private</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Main page ----------------------------------------------------------------

export default function OrganizationsPage() {
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

  // Dept filter
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null)

  // Tab
  const [tab, setTab] = useState<'discover' | 'my-teams'>('discover')

  // Joining state (teamId -> loading)
  const [joiningTeam, setJoiningTeam] = useState<string | null>(null)

  // Members modal
  const [membersDialog, setMembersDialog] = useState<{
    open: boolean
    team: TeamResponse | null
    members: UserTeamResponse[]
    loading: boolean
  }>({
    open: false,
    team: null,
    members: [],
    loading: false,
  })

  // -- Load -----------------------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [depts, visibleTeams, mine] = await Promise.all([
        departmentApi.getActive(),
        teamApi.getVisible(),
        teamApi.getMy(),
      ])
      setDepartments(depts)
      setTeams(visibleTeams)
      setMyTeams(mine)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // -- Search ---------------------------------------------------------------

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
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
  }, [searchQuery])

  // -- Join / Leave ---------------------------------------------------------

  async function handleJoin(team: TeamResponse) {
    setJoiningTeam(team.id)
    try {
      const updated = await teamApi.join(team.id)
      // Update all team lists
      const patch = (list: TeamResponse[]) => list.map((t) => (t.id === updated.id ? updated : t))
      setTeams(patch)
      setSearchResults((prev) => (prev ? patch(prev) : null))
      setMyTeams((prev) => [...prev.filter((t) => t.id !== updated.id), updated])
    } catch (e: any) {
      alert(e.message)
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
    } catch (e: any) {
      alert(e.message)
    } finally {
      setJoiningTeam(null)
    }
  }

  // -- Members modal ---------------------------------------------------------

  async function handleViewMembers(team: TeamResponse) {
    setMembersDialog({ open: true, team, members: [], loading: true })
    try {
      const members = await teamApi.getMembers(team.id)
      setMembersDialog((prev) => ({ ...prev, members, loading: false }))
    } catch {
      setMembersDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  // -- Derived --------------------------------------------------------------

  const displayedTeams = (() => {
    const base = searchResults ?? teams
    if (!activeDeptId || searchResults) return base
    return base.filter((t) => t.departmentId === activeDeptId)
  })()

  // -- Render ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Discover Teams</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Find your people — browse departments and join teams
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {error && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{departments.length}</p>
                  <p className="text-muted-foreground text-xs">Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-violet-500/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="text-xl font-bold">{teams.length}</p>
                  <p className="text-muted-foreground text-xs">Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{myTeams.length}</p>
                  <p className="text-muted-foreground text-xs">My Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-border flex gap-1 border-b">
          {(
            [
              ['discover', 'Discover'],
              ['my-teams', 'My Teams'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              {label}
              {key === 'my-teams' && myTeams.length > 0 && (
                <span className="bg-primary/10 text-primary ml-2 rounded-full px-1.5 py-0.5 text-xs font-semibold">
                  {myTeams.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* -- Discover tab ---------------------------------------------------- */}
        {tab === 'discover' && (
          <div className="space-y-5">
            {/* Search */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams by name…"
                className="pr-9 pl-9"
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

            {/* Department filter pills — hidden during search */}
            {!searchQuery && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveDeptId(null)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeDeptId === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  All Departments
                </button>
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setActiveDeptId(dept.id === activeDeptId ? null : dept.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeDeptId === dept.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {dept.name}
                    <span className="ml-1.5 opacity-70">{dept.teamCount}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Results */}
            {searching && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </div>
            )}

            {searchResults !== null && !searching && (
              <p className="text-muted-foreground text-sm">
                {searchResults.length === 0
                  ? 'No teams found.'
                  : `${searchResults.length} team${searchResults.length !== 1 ? 's' : ''} found`}
              </p>
            )}

            {/* Department sections (no search active) */}
            {!searchQuery && !activeDeptId && (
              <div className="space-y-8">
                {departments.length === 0 && (
                  <p className="text-muted-foreground py-8 text-center">
                    No departments available yet.
                  </p>
                )}
                {departments.map((dept) => {
                  const deptTeams = teams.filter((t) => t.departmentId === dept.id)
                  if (deptTeams.length === 0) return null
                  return (
                    <div key={dept.id} className="space-y-3">
                      {/* Dept header */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <Building2 className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold">{dept.name}</h2>
                          {dept.manager && (
                            <p className="text-muted-foreground text-xs">
                              Managed by {dept.manager.firstName} {dept.manager.lastName}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {deptTeams.length} team{deptTeams.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {deptTeams.map((team) => (
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
                    </div>
                  )
                })}
              </div>
            )}

            {/* Filtered by dept or search results */}
            {(searchQuery || activeDeptId) && !searching && (
              <div className="grid gap-3 sm:grid-cols-2">
                {displayedTeams.length === 0 ? (
                  <p className="text-muted-foreground col-span-2 py-10 text-center">
                    No teams found.
                  </p>
                ) : (
                  displayedTeams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      onViewMembers={handleViewMembers}
                      joining={joiningTeam === team.id}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* -- My Teams tab --------------------------------------------------- */}
        {tab === 'my-teams' && (
          <div className="space-y-4">
            {myTeams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <Users className="text-muted-foreground h-8 w-8" />
                </div>
                <h3 className="mb-1 font-semibold">You haven't joined any teams yet</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Discover public teams and join the ones that interest you.
                </p>
                <Button onClick={() => setTab('discover')}>
                  <Search className="mr-2 h-4 w-4" /> Discover Teams
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {myTeams.map((team) => (
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
      </div>

      {/* -- Members Dialog ---------------------------------------------------- */}
      <Dialog
        open={membersDialog.open}
        onOpenChange={(open) => !open && setMembersDialog((prev) => ({ ...prev, open: false }))}
      >
        <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {membersDialog.team?.name} — Members
            </DialogTitle>
            <DialogDescription>
              {membersDialog.team?.memberCount} member
              {membersDialog.team?.memberCount !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto py-2">
            {membersDialog.loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : membersDialog.members.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">No members yet.</p>
            ) : (
              membersDialog.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-1 py-1.5">
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
    </div>
  )
}
