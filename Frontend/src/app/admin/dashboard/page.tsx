'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Users,
  MessageSquare,
  Heart,
  TrendingUp,
  Loader2,
  FileText,
  Building2,
  UsersRound,
  FolderKanban,
  Clock,
  ShieldAlert,
} from 'lucide-react'
import {
  userApi,
  roleApi,
  statsApi,
  auditApi,
  UserResponse,
  RoleResponse,
  PostStats,
  OrgStats,
  ActivityStats,
} from '@/lib/api'

const chartConfig = {
  users: { label: 'Total Users', color: 'hsl(var(--chart-1))' },
  active: { label: 'Active Users', color: 'hsl(var(--chart-2))' },
  posts: { label: 'Posts', color: 'hsl(var(--chart-1))' },
  comments: { label: 'Comments', color: 'hsl(var(--chart-2))' },
  reactions: { label: 'Reactions', color: 'hsl(var(--chart-3))' },
  siteActivity: { label: 'Logins & Actions', color: 'hsl(var(--chart-1))' },
  contentActivity: { label: 'Posts, Comments & Reactions', color: 'hsl(var(--chart-2))' },
}

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f97316',
  '#14b8a6',
]

function formatDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatHour(hour: number) {
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [postStats, setPostStats] = useState<PostStats | null>(null)
  const [orgStats, setOrgStats] = useState<OrgStats | null>(null)
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [restrictedSections, setRestrictedSections] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const restricted: string[] = []

    const [usersRes, rolesRes, postStatsRes, orgStatsRes, activityRes] = await Promise.allSettled([
      userApi.getAll(),
      roleApi.getAll(),
      statsApi.getPostStats(),
      statsApi.getOrgStats(),
      auditApi.getActivityStats(),
    ])

    if (usersRes.status === 'fulfilled') setUsers(usersRes.value)
    if (rolesRes.status === 'fulfilled') setRoles(rolesRes.value)

    if (postStatsRes.status === 'fulfilled') setPostStats(postStatsRes.value)
    else restricted.push('posts')

    if (orgStatsRes.status === 'fulfilled') setOrgStats(orgStatsRes.value)
    else restricted.push('organization')

    if (activityRes.status === 'fulfilled') setActivityStats(activityRes.value)
    else restricted.push('activity')

    setRestrictedSections(restricted)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const activeUsers = users.filter((u) => u.active)

  // Build user growth chart from real createdAt timestamps
  const userGrowthData = (() => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const now = new Date()
    const last6: { month: string; users: number; active: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = months[d.getMonth()]
      const cutoff = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const total = users.filter((u) => new Date(u.createdAt) < cutoff).length
      const active = users.filter((u) => new Date(u.createdAt) < cutoff && u.active).length
      last6.push({ month: monthLabel, users: total, active })
    }
    return last6
  })()

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Merge posts/comments/reactions per-day series into one dataset for the combined chart
  const engagementPerDay = (() => {
    if (!postStats) return []
    return postStats.postsPerDay.map((d, i) => ({
      day: formatDay(d.date),
      posts: d.count,
      comments: postStats.commentsPerDay[i]?.count ?? 0,
      reactions: postStats.reactionsPerDay[i]?.count ?? 0,
    }))
  })()

  // Merge audit-log activity (logins/actions) with content activity (posts/comments/reactions) by hour
  const activityByHourData = (() => {
    const hours = Array.from({ length: 24 }, (_, h) => h)
    return hours.map((h) => ({
      hour: formatHour(h),
      siteActivity: activityStats?.activityByHour.find((a) => a.hour === h)?.count ?? 0,
      contentActivity: postStats?.activityByHour.find((a) => a.hour === h)?.count ?? 0,
    }))
  })()

  const reactionsPieData = (postStats?.reactionsByType ?? []).map((r, i) => ({
    name: `${r.emoji} ${r.name}`,
    value: r.count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const postsByTypeData = (postStats?.postsByType ?? []).map((p) => ({
    name: titleCase(p.name),
    count: p.count,
  }))

  const projectsByStatusPie = (orgStats?.projectsByStatus ?? []).map((p, i) => ({
    name: titleCase(p.name),
    value: p.count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const teamsByDepartmentData = (orgStats?.teamsByDepartment ?? []).slice(0, 8).map((t) => ({
    name: t.name,
    teams: t.count,
  }))

  const metrics = [
    {
      title: 'Total Users',
      value: loading ? '—' : users.length.toString(),
      change: `${activeUsers.length} active`,
      icon: Users,
    },
    {
      title: 'Posts',
      value: loading ? '—' : postStats ? postStats.totalPosts.toString() : '—',
      change: postStats ? `${postStats.postsToday} today` : 'Restricted',
      icon: FileText,
    },
    {
      title: 'Comments',
      value: loading ? '—' : postStats ? postStats.totalComments.toString() : '—',
      change: postStats ? `${postStats.avgCommentsPerPost} avg / post` : 'Restricted',
      icon: MessageSquare,
    },
    {
      title: 'Reactions',
      value: loading ? '—' : postStats ? postStats.totalReactions.toString() : '—',
      change: postStats ? `${postStats.avgReactionsPerPost} avg / post` : 'Restricted',
      icon: Heart,
    },
    {
      title: 'Departments',
      value: loading ? '—' : orgStats ? orgStats.totalDepartments.toString() : '—',
      change: orgStats ? `${orgStats.activeDepartments} active` : 'Restricted',
      icon: Building2,
    },
    {
      title: 'Teams',
      value: loading ? '—' : orgStats ? orgStats.totalTeams.toString() : '—',
      change: orgStats ? `${orgStats.avgMembersPerTeam} avg members` : 'Restricted',
      icon: UsersRound,
    },
    {
      title: 'Projects',
      value: loading ? '—' : orgStats ? orgStats.totalProjects.toString() : '—',
      change: orgStats ? `${orgStats.avgTeamsPerDepartment} teams / dept` : 'Restricted',
      icon: FolderKanban,
    },
    {
      title: 'Roles',
      value: loading ? '—' : roles.length.toString(),
      change: `${roles.reduce((sum, r) => sum + r.permissions.length, 0)} total permissions`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Live statistics across users, content, organization, and website activity.
          </p>
        </div>
        {loading && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading live data…
          </div>
        )}
      </div>

      {!loading && restrictedSections.length > 0 && (
        <div className="border-border bg-muted/40 flex items-start gap-2 rounded-lg border p-3 text-sm">
          <ShieldAlert className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-muted-foreground">
            Some sections ({restrictedSections.join(', ')}) require CEO or HR back-office access and
            could not be loaded for your role.
          </p>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ title, value, change, icon: Icon }) => (
          <Card key={title} className="dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-muted-foreground text-xs">{change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Community engagement ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Community Engagement</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="dark:border-slate-700">
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Total and active users over last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
                    <XAxis
                      dataKey="month"
                      stroke="currentColor"
                      className="text-muted-foreground"
                    />
                    <YAxis stroke="currentColor" className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="active"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="dark:border-slate-700">
            <CardHeader>
              <CardTitle>Posts, Comments &amp; Reactions</CardTitle>
              <CardDescription>Last 14 days of activity</CardDescription>
            </CardHeader>
            <CardContent>
              {postStats ? (
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementPerDay}>
                      <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
                      <XAxis
                        dataKey="day"
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <YAxis stroke="currentColor" className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="posts"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="comments"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="reactions"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <EmptyState loading={loading} />
              )}
            </CardContent>
          </Card>

          <Card className="dark:border-slate-700">
            <CardHeader>
              <CardTitle>Reactions by Type</CardTitle>
              <CardDescription>How people react to posts and comments</CardDescription>
            </CardHeader>
            <CardContent>
              {postStats && reactionsPieData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reactionsPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {reactionsPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <EmptyState loading={loading} />
              )}
            </CardContent>
          </Card>

          <Card className="dark:border-slate-700">
            <CardHeader>
              <CardTitle>Posts by Type</CardTitle>
              <CardDescription>Announcements, discussions, questions, and more</CardDescription>
            </CardHeader>
            <CardContent>
              {postStats && postsByTypeData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={postsByTypeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
                      <XAxis
                        type="number"
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <EmptyState loading={loading} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Website activity ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="text-muted-foreground h-5 w-5" />
          <h2 className="text-lg font-semibold">Hours of Activity</h2>
        </div>
        <Card className="dark:border-slate-700">
          <CardHeader>
            <CardTitle>When people use the platform</CardTitle>
            <CardDescription>
              Logins &amp; account actions vs. posts / comments / reactions, by hour of day (last 30
              days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activityStats || postStats ? (
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityByHourData}>
                    <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
                    <XAxis dataKey="hour" stroke="currentColor" className="text-muted-foreground" />
                    <YAxis stroke="currentColor" className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="siteActivity" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="contentActivity"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <EmptyState loading={loading} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Organization ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Organization</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="dark:border-slate-700">
            <CardHeader>
              <CardTitle>Teams by Department</CardTitle>
              <CardDescription>Where teams are concentrated</CardDescription>
            </CardHeader>
            <CardContent>
              {orgStats && teamsByDepartmentData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamsByDepartmentData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
                      <XAxis
                        type="number"
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="teams" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <EmptyState loading={loading} />
              )}
            </CardContent>
          </Card>

          <Card className="dark:border-slate-700">
            <CardHeader>
              <CardTitle>Projects by Status</CardTitle>
              <CardDescription>Planning through completion</CardDescription>
            </CardHeader>
            <CardContent>
              {orgStats && projectsByStatusPie.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectsByStatusPie}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {projectsByStatusPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <EmptyState loading={loading} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Recent activity ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="dark:border-slate-700">
          <CardHeader>
            <CardTitle>Recently Joined Users</CardTitle>
            <CardDescription>Newest members from database</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : recentUsers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No users found.</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="border-border flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-muted-foreground text-sm">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {user.active ? (
                          <span className="text-green-500">Active</span>
                        ) : (
                          <span className="text-muted-foreground">Inactive</span>
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dark:border-slate-700">
          <CardHeader>
            <CardTitle>Top Audit Actions</CardTitle>
            <CardDescription>
              Most frequent account &amp; security events (last 30 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : activityStats && activityStats.topActions.length > 0 ? (
              <div className="space-y-3">
                {activityStats.topActions.map((action) => (
                  <div key={action.name} className="flex items-center justify-between">
                    <span className="text-sm">{titleCase(action.name)}</span>
                    <Badge variant="secondary">{action.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No audit activity available for your role.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="text-muted-foreground flex h-80 items-center justify-center text-sm">
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Not available for your role.'}
    </div>
  )
}
