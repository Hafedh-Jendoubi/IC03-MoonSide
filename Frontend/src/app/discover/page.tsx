'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Loader2,
  X,
  UserPlus,
  UserMinus,
  Mail,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  Globe,
  BadgeCheck,
  Building2,
  UserCheck,
  Lock,
} from 'lucide-react'
import {
  teamApi,
  departmentApi,
  userApi,
  TeamResponse,
  DepartmentResponse,
  UserResponse,
} from '@/lib/api'
import { AuthLayout } from '@/components/auth-layout'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

// ── Independent Team Card ─────────────────────────────────────────────────────

interface TeamCardProps {
  team: TeamResponse
  onFollow: (team: TeamResponse) => void
  onUnfollow: (team: TeamResponse) => void
  following: boolean
}

function TeamCard({ team, onFollow, onUnfollow, following }: TeamCardProps) {
  return (
    <Link href={`/team/${team.id}`} className="block h-full">
      <div className="bg-background border-border group flex h-full flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
        {/* Banner / Avatar header */}
        <div className="relative h-24 bg-gradient-to-br from-slate-700 to-slate-800">
          {team.bannerUrl && (
            <img src={team.bannerUrl} alt="" className="h-full w-full object-cover opacity-70" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Avatar */}
          <div className="absolute bottom-0 left-4 translate-y-1/2">
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
        <div className="flex flex-1 flex-col gap-3 px-4 pt-10 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-foreground truncate font-semibold">{team.name}</h3>
              {team.teamVisibility ? (
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
                  <span className="text-primary text-[10px] font-bold">
                    {team.lead.firstName[0]}
                  </span>
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
          <div className="border-border mt-auto flex items-center justify-end border-t pt-3">
            {team.isFollowing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onUnfollow(team)
                }}
                disabled={following}
                className="h-7 text-xs"
              >
                {following ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <UserMinus className="h-3 w-3" />
                )}
                <span className="ml-1">Unfollow</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onFollow(team)
                }}
                disabled={following}
                className="h-7 text-xs"
              >
                {following ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <UserPlus className="h-3 w-3" />
                )}
                <span className="ml-1">Follow</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Department Card ───────────────────────────────────────────────────────────

interface DepartmentCardProps {
  department: DepartmentResponse
  onFollow: (dept: DepartmentResponse) => void
  onUnfollow: (dept: DepartmentResponse) => void
  following: boolean
}

function DepartmentCard({ department, onFollow, onUnfollow, following }: DepartmentCardProps) {
  return (
    <Link href={`/department/${department.id}`} className="block h-full">
      <div className="bg-background border-border group flex h-full flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
        {/* Banner */}
        <div className="relative h-24 bg-gradient-to-br from-violet-900/70 to-indigo-900/70">
          {department.bannerUrl && (
            <img
              src={department.bannerUrl}
              alt=""
              className="h-full w-full object-cover opacity-70"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Avatar */}
          <div className="absolute bottom-0 left-4 translate-y-1/2">
            <div className="border-background bg-muted flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 text-lg font-bold">
              {department.avatarUrl ? (
                <img
                  src={department.avatarUrl}
                  alt={department.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="text-muted-foreground h-6 w-6" />
              )}
            </div>
          </div>
          {/* Active badge */}
          {department.isActive && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                Active
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 px-4 pt-10 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-foreground truncate font-semibold">{department.name}</h3>
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <Users className="h-3 w-3" />
                <span>
                  {department.teamCount} {department.teamCount === 1 ? 'team' : 'teams'}
                </span>
              </div>
            </div>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <UserCheck className="h-3.5 w-3.5" />
              <span>{department.followerCount}</span>
            </div>
          </div>

          {department.description && (
            <p className="text-muted-foreground line-clamp-2 flex-1 text-sm">
              {department.description}
            </p>
          )}

          {department.manager && (
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
                {department.manager.avatar ? (
                  <img
                    src={department.manager.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-primary text-[10px] font-bold">
                    {department.manager.firstName[0]}
                  </span>
                )}
              </div>
              <span className="text-muted-foreground text-xs">
                Managed by{' '}
                <span className="text-foreground font-medium">
                  {department.manager.firstName} {department.manager.lastName}
                </span>
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="border-border mt-auto flex items-center justify-end border-t pt-3">
            {department.isFollowing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  onUnfollow(department)
                }}
                disabled={following}
                className="h-7 text-xs"
              >
                {following ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <UserMinus className="h-3 w-3" />
                )}
                <span className="ml-1">Unfollow</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  onFollow(department)
                }}
                disabled={following}
                className="h-7 text-xs"
              >
                {following ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <UserPlus className="h-3 w-3" />
                )}
                <span className="ml-1">Follow</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ActiveTab = 'teams' | 'departments'
type TeamSortType = 'name' | 'members'
type DeptSortType = 'name' | 'teams' | 'followers'

export default function DiscoverPage() {
  const { user: currentUser } = useAuth()

  const [independentTeams, setIndependentTeams] = useState<TeamResponse[]>([])
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<ActiveTab>('departments')

  // Team controls
  const [teamSearch, setTeamSearch] = useState('')
  const [teamSort, setTeamSort] = useState<TeamSortType>('name')
  const [followingTeam, setFollowingTeam] = useState<string | null>(null)

  // Department controls
  const [deptSearch, setDeptSearch] = useState('')
  const [deptSort, setDeptSort] = useState<DeptSortType>('name')
  const [followingDept, setFollowingDept] = useState<string | null>(null)

  // People carousel
  const [currentUserIndex, setCurrentUserIndex] = useState(0)

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // ── Load ─────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [indTeams, depts, allUsers] = await Promise.all([
        teamApi.getIndependent(),
        departmentApi.getAll(),
        userApi.getAll(),
      ])
      setIndependentTeams(indTeams)
      setDepartments(depts)
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

  // ── Follow / Unfollow Team ────────────────────────────────────────────────

  async function handleFollowTeam(team: TeamResponse) {
    setFollowingTeam(team.id)
    try {
      const updated = await teamApi.follow(team.id)
      setIndependentTeams((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...updated, isFollowing: true } : t))
      )
      showToast(`You are now following ${team.name}!`, 'success')
    } catch (e: any) {
      showToast(e.message ?? 'Could not follow team', 'error')
    } finally {
      setFollowingTeam(null)
    }
  }

  async function handleUnfollowTeam(team: TeamResponse) {
    setFollowingTeam(team.id)
    try {
      const updated = await teamApi.unfollow(team.id)
      setIndependentTeams((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...updated, isFollowing: false } : t))
      )
      showToast(`Unfollowed ${team.name}`, 'success')
    } catch (e: any) {
      showToast(e.message ?? 'Could not unfollow team', 'error')
    } finally {
      setFollowingTeam(null)
    }
  }

  // ── Follow / Unfollow Department ──────────────────────────────────────────

  async function handleFollow(dept: DepartmentResponse) {
    setFollowingDept(dept.id)
    try {
      const updated = await departmentApi.follow(dept.id)
      setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
      showToast(`You are now following ${dept.name}!`, 'success')
    } catch (e: any) {
      showToast(e.message ?? 'Could not follow department', 'error')
    } finally {
      setFollowingDept(null)
    }
  }

  async function handleUnfollow(dept: DepartmentResponse) {
    setFollowingDept(dept.id)
    try {
      const updated = await departmentApi.unfollow(dept.id)
      setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
      showToast(`Unfollowed ${dept.name}`, 'success')
    } catch (e: any) {
      showToast(e.message ?? 'Could not unfollow department', 'error')
    } finally {
      setFollowingDept(null)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const filteredTeams = independentTeams
    .filter((t) => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
    .sort((a, b) =>
      teamSort === 'members' ? b.memberCount - a.memberCount : a.name.localeCompare(b.name)
    )

  const filteredDepts = departments
    .filter((d) => d.name.toLowerCase().includes(deptSearch.toLowerCase()))
    .sort((a, b) => {
      if (deptSort === 'teams') return b.teamCount - a.teamCount
      if (deptSort === 'followers') return b.followerCount - a.followerCount
      return a.name.localeCompare(b.name)
    })

  const followingTeamCount = independentTeams.filter((t) => t.isFollowing).length
  const followingCount = departments.filter((d) => d.isFollowing).length

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

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={<Building2 className="h-5 w-5 text-violet-400" />}
              label="Departments"
              value={departments.length}
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-blue-400" />}
              label="Independent Teams"
              value={independentTeams.length}
            />
          </div>

          {/* Tab switcher */}
          <div className="border-border flex w-fit gap-1 rounded-xl border p-1">
            <TabBtn
              active={activeTab === 'departments'}
              onClick={() => setActiveTab('departments')}
            >
              <Building2 className="h-4 w-4" /> Departments
            </TabBtn>
            <TabBtn active={activeTab === 'teams'} onClick={() => setActiveTab('teams')}>
              <Users className="h-4 w-4" /> Independent Teams
            </TabBtn>
          </div>

          {/* ── DEPARTMENTS TAB ────────────────────────────────────────────── */}
          {activeTab === 'departments' && (
            <div className="space-y-5">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-48 flex-1">
                  <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                  <Input
                    placeholder="Search departments…"
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={deptSort === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeptSort('name')}
                  >
                    A–Z
                  </Button>
                  <Button
                    variant={deptSort === 'teams' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeptSort('teams')}
                  >
                    Most Teams
                  </Button>
                  <Button
                    variant={deptSort === 'followers' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeptSort('followers')}
                  >
                    Most Followers
                  </Button>
                </div>
              </div>

              {filteredDepts.length === 0 ? (
                <Empty
                  icon={<Building2 className="h-8 w-8" />}
                  title={deptSearch ? 'No departments match your search' : 'No departments yet'}
                  subtitle={
                    deptSearch ? '' : 'Departments across the organization will appear here.'
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDepts.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      department={dept}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                      following={followingDept === dept.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

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
                      onFollow={handleFollowTeam}
                      onUnfollow={handleUnfollowTeam}
                      following={followingTeam === team.id}
                    />
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
                    style={{
                      transform: `translateX(-${currentUserIndex * (100 / Math.min(users.length, 4))}%)`,
                    }}
                  >
                    {users.map((user) => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.id}`}
                        className="flex-shrink-0"
                        style={{ width: `calc(${100 / Math.min(users.length, 4)}% - 12px)` }}
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
                        setCurrentUserIndex(
                          (i) => (i - 1 + Math.ceil(users.length / 4)) % Math.ceil(users.length / 4)
                        )
                      }
                      className="bg-background border-border hover:bg-muted text-foreground rounded-full border p-2 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentUserIndex((i) => (i + 1) % Math.ceil(users.length / 4))
                      }
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
