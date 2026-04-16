'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Building2,
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
} from 'lucide-react'
import {
  departmentApi,
  teamApi,
  userApi,
  DepartmentResponse,
  TeamResponse,
  UserTeamResponse,
  UserResponse,
} from '@/lib/api'
import { AuthLayout } from '@/components/auth-layout'
import Link from 'next/link'

// ─── Department Card ──────────────────────────────────────────────────────────

interface DepartmentCardProps {
  dept: DepartmentResponse
  teamCount: number
}

function DepartmentCard({ dept, teamCount }: DepartmentCardProps) {
  return (
    <Link href={`/department/${dept.id}`}>
      <div className="bg-background border-border hover:border-border/80 flex h-full cursor-pointer flex-col space-y-4 rounded-lg border p-6 transition-all duration-200 hover:shadow-md">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="bg-muted flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
            <Building2 className="text-foreground h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground line-clamp-1 text-lg font-semibold">{dept.name}</h3>
            {dept.description && (
              <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">{dept.description}</p>
            )}
          </div>
        </div>

        {/* Manager info */}
        {dept.manager && (
          <div className="text-muted-foreground text-xs">
            Led by {dept.manager.firstName} {dept.manager.lastName}
          </div>
        )}

        {/* Footer */}
        <div className="border-border mt-auto border-t pt-3">
          <p className="text-muted-foreground text-sm font-medium">
            {teamCount} team{teamCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ─── Team Card ────────────────────────────────────────────────────────────────

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
    <div className="bg-background border-border flex h-full flex-col space-y-4 rounded-lg border p-5 transition-shadow duration-200 hover:shadow-md">
      {/* Team Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground truncate font-semibold">{team.name}</h3>
          {isPrivate && (
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
              <Lock className="h-3 w-3" />
              <span>Private</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {team.description && (
        <p className="text-muted-foreground line-clamp-2 flex-grow text-sm">{team.description}</p>
      )}

      {/* Team Lead */}
      {team.lead && (
        <div className="text-muted-foreground border-border space-y-1 border-t py-2 text-xs">
          <p className="text-foreground font-medium">Team Lead</p>
          <p>
            {team.lead.firstName} {team.lead.lastName}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="border-border mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <button
          onClick={() => onViewMembers(team)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
        >
          <Users className="h-4 w-4" />
          <span>{team.memberCount} members</span>
        </button>

        {team.isMember ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onLeave(team)}
            disabled={joining}
            className="h-8 text-xs"
          >
            {joining ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <UserMinus className="h-3 w-3" />
            )}
            <span className="ml-1">Leave</span>
          </Button>
        ) : isPrivate ? (
          <Button size="sm" variant="ghost" disabled className="h-8 text-xs">
            <Lock className="h-3 w-3" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => onJoin(team)} disabled={joining} className="h-8 text-xs">
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

// ─── User Card ────────────────────────────────────────────────────────────────

interface UserCardProps {
  user: UserTeamResponse
}

function UserCard({ user }: UserCardProps) {
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

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEPARTMENTS_PER_PAGE = 6

export default function DiscoverPage() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [myTeams, setMyTeams] = useState<TeamResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
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

  // Department pagination
  const [displayedDeptCount, setDisplayedDeptCount] = useState(DEPARTMENTS_PER_PAGE)

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
      const [depts, publicTeams, mine, allUsers] = await Promise.all([
        departmentApi.getActive(),
        teamApi.getPublic(),
        teamApi.getMy(),
        userApi.getAll(),
      ])
      // Merge isMember flag
      const myIds = new Set(mine.map((t) => t.id))
      const merged = publicTeams.map((t) => ({ ...t, isMember: myIds.has(t.id) }))
      setDepartments(depts)
      setTeams(merged)
      setMyTeams(mine)
      setUsers(allUsers)
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
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
          {/* ── Error banner ──────────────────────────────────────────────── */}
          {error && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
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

          {/* ── Search Bar ────────────────────────────────────────────────── */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DEPARTMENTS AND TEAMS                                          */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-8">
            {/* ── Departments Grid ──────────────────────────────────────── */}
            {departments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <Building2 className="text-muted-foreground h-8 w-8" />
                </div>
                <p className="text-foreground font-semibold">No departments yet</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Check back once your admin sets up the organization structure.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-foreground text-xl font-semibold">
                  Departments & Joined Departments
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {departments.slice(0, displayedDeptCount).map((dept) => {
                    const deptTeams = teams.filter((t) => t.departmentId === dept.id)
                    return <DepartmentCard key={dept.id} dept={dept} teamCount={deptTeams.length} />
                  })}
                </div>

                {/* Load More Button */}
                {displayedDeptCount < departments.length && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setDisplayedDeptCount((prev) => prev + DEPARTMENTS_PER_PAGE)}
                    >
                      Load More...
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DISCOVER TAB                                                   */}
          {/* ════════════════════════════════════════════════════════��══════ */}
          {tab === 'all' && (
            <div className="space-y-8">
              {/* ── Search Results ──────────────────────────────────────── */}
              {searchQuery && (
                <>
                  {searching && (
                    <div className="text-muted-foreground flex items-center justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                  {!searching && searchResults !== null && (
                    <>
                      {displayedInSearch.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <p className="text-muted-foreground">
                            No teams found matching "{searchQuery}"
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <p className="text-muted-foreground text-sm">
                            {displayedInSearch.length} team
                            {displayedInSearch.length !== 1 ? 's' : ''} found
                          </p>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {displayedInSearch.map((team) => (
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
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── All departments grouped ─────────────────────────────── */}
              {!searchQuery && (
                <>
                  {departments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                        <Building2 className="text-muted-foreground h-8 w-8" />
                      </div>
                      <p className="text-foreground font-semibold">No departments yet</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Check back once your admin sets up the organization structure.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {departments.slice(0, displayedDeptCount).map((dept) => {
                        const deptTeams = teams.filter((t) => t.departmentId === dept.id)
                        return (
                          <DepartmentCard key={dept.id} dept={dept} teamCount={deptTeams.length} />
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MY TEAMS TAB                                                   */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {tab === 'my-teams' && (
            <>
              {myTeams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                    <Users className="text-muted-foreground h-8 w-8" />
                  </div>
                  <h3 className="text-foreground font-semibold">
                    You haven&apos;t joined any teams yet
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Browse public teams and join ones that interest you.
                  </p>
                  <Button className="mt-5" onClick={() => setTab('all')}>
                    Explore Teams
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PEOPLE YOU MAY KNOW SECTION                                     */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {users.length > 0 && (
            <div className="border-border mt-12 space-y-4 border-t pt-8">
              <h2 className="text-foreground text-lg font-semibold">People You May Know</h2>
              <div className="relative">
                {/* Carousel container - shows 4 cards */}
                <div className="overflow-hidden">
                  <div
                    className="flex gap-4 transition-transform duration-300 ease-out"
                    style={{
                      transform: `translateX(-${currentUserIndex * 25}%)`,
                    }}
                  >
                    {users.map((user) => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.id}`}
                        className="w-1/4 flex-shrink-0"
                      >
                        <div className="bg-background border-border hover:border-border/80 flex h-full cursor-pointer flex-col space-y-4 rounded-lg border p-4 transition-all duration-200 hover:shadow-md">
                          {/* Avatar */}
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

                          {/* Name and Job Title */}
                          <div className="flex-1 space-y-1 text-center">
                            <h3 className="text-foreground hover:text-primary line-clamp-1 text-sm font-semibold transition-colors">
                              {user.firstName} {user.lastName}
                            </h3>
                            {user.jobTitle && (
                              <p className="text-muted-foreground line-clamp-1 text-xs">
                                {user.jobTitle}
                              </p>
                            )}
                          </div>

                          {/* Bio */}
                          {user.bio && (
                            <p className="text-muted-foreground line-clamp-2 text-center text-xs">
                              {user.bio}
                            </p>
                          )}

                          {/* Email */}
                          <div className="border-border border-t pt-3">
                            <a
                              href={`mailto:${user.email}`}
                              onClick={(e) => e.preventDefault()}
                              className="text-primary flex items-center justify-center gap-1 truncate text-xs hover:underline"
                              title={user.email}
                            >
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </a>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Navigation buttons */}
                {users.length > 4 && (
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button
                      onClick={() =>
                        setCurrentUserIndex((i) => (i - 1 + users.length) % users.length)
                      }
                      className="bg-background border-border hover:bg-muted text-foreground rounded-full border p-2 transition-colors"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => setCurrentUserIndex((i) => (i + 1) % users.length)}
                      className="bg-background border-border hover:bg-muted text-foreground rounded-full border p-2 transition-colors"
                      aria-label="Next"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Members Dialog ──────────────────────────────────────────────────── */}
        <Dialog
          open={membersDialog.open}
          onOpenChange={(open) => !open && setMembersDialog((prev) => ({ ...prev, open: false }))}
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
                    <div key={m.id}>
                      {m.user ? (
                        <UserCard user={m} />
                      ) : (
                        <p className="text-muted-foreground text-sm">Unknown user</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Toast notification ──────────────────────────────────────────────── */}
        {toast ? (
          <div
            className={`animate-slide-up fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-background text-foreground border-border'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 flex-shrink-0" />
            )}
            {toast.msg}
          </div>
        ) : null}
      </div>
    </AuthLayout>
  )
}
