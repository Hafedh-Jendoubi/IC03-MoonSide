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

// --- Department Card ----------------------------------------------------------

interface DepartmentCardProps {
  dept: DepartmentResponse
  teamCount: number
}

// Helper function to generate a consistent color/image for each department
function getDepartmentImage(deptId: string): string {
  const images = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&h=300&fit=crop',
  ]
  // Use department ID to deterministically pick an image (hash all characters)
  const hash = Array.from(deptId).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const index = hash % images.length
  return images[index]
}

function DepartmentCard({ dept, teamCount }: DepartmentCardProps) {
  const imageUrl = getDepartmentImage(dept.id)

  return (
    <Link href={`/department/${dept.id}`}>
      <div className="group overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg">
        {/* Image Container */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-400 to-slate-600">
          <img
            src={imageUrl}
            alt={dept.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:bg-black/10" />
        </div>

        {/* Content Container */}
        <div className="bg-background border-border flex h-full flex-col space-y-3 border border-t-0 p-4">
          {/* Department Code/ID */}
          <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            DEPT.{dept.id.slice(0, 8).toUpperCase()}
          </div>

          {/* Department Name */}
          <div>
            <h3 className="text-foreground line-clamp-2 text-base font-semibold">{dept.name}</h3>
          </div>

          {/* Description */}
          {dept.description && (
            <p className="text-muted-foreground line-clamp-2 text-xs">{dept.description}</p>
          )}

          {/* Manager info */}
          {dept.manager && (
            <div className="text-muted-foreground text-xs">
              {dept.manager.firstName} {dept.manager.lastName}
            </div>
          )}

          {/* Footer - Team Count */}
          <div className="border-border mt-auto border-t pt-3">
            <p className="text-muted-foreground text-sm font-medium">
              {teamCount} team{teamCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

// --- Team Card ----------------------------------------------------------------

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

// --- User Card ----------------------------------------------------------------

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

// --- Main Page ----------------------------------------------------------------

const DEPARTMENTS_PER_PAGE = 6

type DeptSortType = 'name' | 'teams' | 'followers'

export default function DiscoverPage() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [myTeams, setMyTeams] = useState<TeamResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search for departments
  const [deptSearchQuery, setDeptSearchQuery] = useState('')
  const [deptSortBy, setDeptSortBy] = useState<DeptSortType>('name')

  // Search for teams
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TeamResponse[] | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // -- Load ------------------------------------------------------------------

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

  // -- Toast -----------------------------------------------------------------

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // -- Search ----------------------------------------------------------------

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

  // -- Join / Leave ----------------------------------------------------------

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

  // -- Derived lists ---------------------------------------------------------

  const displayedInSearch = (() => {
    const base = searchResults ?? []
    if (activeDeptId) return base.filter((t) => t.departmentId === activeDeptId)
    return base
  })()

  const filteredByDept = activeDeptId ? teams.filter((t) => t.departmentId === activeDeptId) : teams

  const joinedCount = teams.filter((t) => t.isMember).length

  // Sort departments
  const sortedDepartments = (() => {
    let filtered = departments.filter((d) =>
      d.name.toLowerCase().includes(deptSearchQuery.toLowerCase())
    )

    const deptTeamCounts = new Map(
      filtered.map((d) => [d.id, teams.filter((t) => t.departmentId === d.id).length])
    )

    if (deptSortBy === 'teams') {
      filtered.sort((a, b) => (deptTeamCounts.get(b.id) || 0) - (deptTeamCounts.get(a.id) || 0))
    } else if (deptSortBy === 'followers') {
      filtered.sort((a, b) => (deptTeamCounts.get(b.id) || 0) - (deptTeamCounts.get(a.id) || 0))
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    }

    return filtered.slice(0, displayedDeptCount)
  })()

  // -- Skeleton --------------------------------------------------------------

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

  // -- Render ----------------------------------------------------------------

  return (
    <AuthLayout>
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
          {/* -- Error banner ------------------------------------------------ */}
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

          {/* --------------------------------------------------------------- */}
          {/* JOINED DEPARTMENTS (MY DEPARTMENTS)                            */}
          {/* --------------------------------------------------------------- */}
          {myTeams.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-foreground text-2xl font-semibold">Joined Departments</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from(new Set(myTeams.map((t) => t.departmentId)))
                  .map((deptId) => {
                    const dept = departments.find((d) => d.id === deptId)
                    if (!dept) return null
                    const deptTeams = teams.filter((t) => t.departmentId === deptId)
                    return <DepartmentCard key={dept.id} dept={dept} teamCount={deptTeams.length} />
                  })
                  .filter(Boolean)}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* SEARCH & FILTER DEPARTMENTS                                    */}
          {/* --------------------------------------------------------------- */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                placeholder="Search departments by name..."
                value={deptSearchQuery}
                onChange={(e) => setDeptSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={deptSortBy === 'name' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeptSortBy('name')}
              >
                Alphabetical
              </Button>
              <Button
                variant={deptSortBy === 'teams' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeptSortBy('teams')}
              >
                Most Teams
              </Button>
              <Button
                variant={deptSortBy === 'followers' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeptSortBy('followers')}
              >
                Most Followed
              </Button>
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* DEPARTMENTS GRID                                               */}
          {/* --------------------------------------------------------------- */}
          <div className="space-y-8">
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
            ) : sortedDepartments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground">No departments match your search.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-foreground text-xl font-semibold">Departments</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedDepartments.slice(0, displayedDeptCount).map((dept) => {
                    const deptTeams = teams.filter((t) => t.departmentId === dept.id)
                    return <DepartmentCard key={dept.id} dept={dept} teamCount={deptTeams.length} />
                  })}
                </div>

                {/* Load More Button */}
                {displayedDeptCount < sortedDepartments.length && (
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

          {/* --------------------------------------------------------------- */}
          {/* PEOPLE YOU MAY KNOW SECTION                                     */}
          {/* --------------------------------------------------------------- */}
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

        {/* -- Members Dialog ---------------------------------------------------- */}
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

        {/* -- Toast notification ------------------------------------------------ */}
        {toast && (
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
        )}
      </div>
    </AuthLayout>
  )
}
