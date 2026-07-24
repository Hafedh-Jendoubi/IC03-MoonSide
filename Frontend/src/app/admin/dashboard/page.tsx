'use client'

import {
  useEffect,
  useState,
  useCallback,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Users,
  MessageSquare,
  Heart,
  ShieldCheck,
  Loader2,
  FileText,
  Building2,
  UsersRound,
  FolderKanban,
  Clock,
  ShieldAlert,
  Flame,
  Sparkles,
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

// ── Palette ──────────────────────────────────────────────────────────────────
// Reuses the app's own chart tokens (defined in globals.css) so the dashboard
// stays on-brand instead of introducing new ad-hoc colors.
const C1 = 'var(--chart-1)' // violet
const C2 = 'var(--chart-2)' // teal
const C3 = 'var(--chart-3)' // green
const C4 = 'var(--chart-4)' // purple-pink
const C5 = 'var(--chart-5)' // blue
const PALETTE = [C1, C2, C3, C4, C5]

function tint(color: string, pct = 16) {
  return `color-mix(in oklch, ${color} ${pct}%, transparent)`
}

// ── Formatting helpers ───────────────────────────────────────────────────────

function formatDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatHour(hour: number) {
  if (hour === 0) return '12a'
  if (hour === 12) return '12p'
  return hour < 12 ? `${hour}a` : `${hour - 12}p`
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function compact(n: number) {
  return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(n)
}

// ── Small reusable building blocks ──────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string; style?: CSSProperties }>
  title: string
  description?: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-md"
        style={{ backgroundColor: tint(C1, 14) }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: C1 }} />
      </div>
      <div>
        <h2 className="text-base leading-tight font-semibold">{title}</h2>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  loading,
}: {
  title: string
  value: string
  change: string
  icon: ComponentType<{ className?: string; style?: CSSProperties }>
  color: string
  loading: boolean
}) {
  return (
    <Card className="dark:border-slate-700/60">
      <CardContent className="flex items-start justify-between gap-3 px-6">
        <div className="min-w-0 space-y-1.5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {title}
          </p>
          {loading ? (
            <div className="bg-muted h-7 w-16 animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          )}
          <p className="text-muted-foreground truncate text-xs">{change}</p>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: tint(color, 15) }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCard({
  icon: Icon,
  color,
  title,
  description,
  action,
  children,
}: {
  icon: ComponentType<{ className?: string; style?: CSSProperties }>
  color: string
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="dark:border-slate-700/60">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: tint(color, 14) }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="text-muted-foreground flex h-72 flex-col items-center justify-center gap-2 text-sm">
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <ShieldAlert className="h-5 w-5" />
          <span>Not available for your role</span>
        </>
      )}
    </div>
  )
}

const axisTick = { fill: 'var(--muted-foreground)', fontSize: 12 }

/** Donut chart with a centered total, shared legend, and themed tooltip. */
function DonutChart({
  data,
  config,
  centerLabel,
}: {
  data: { name: string; value: number; fill: string }[]
  config: ChartConfig
  centerLabel: string
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <div className="relative">
      <ChartContainer config={config} className="mx-auto h-72 w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={data.length > 1 ? 2 : 0}
            strokeWidth={2}
            stroke="var(--card)"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: 8 }}
          />
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[38%] flex -translate-y-1/2 flex-col items-center">
        <span className="text-2xl font-semibold tabular-nums">{compact(total)}</span>
        <span className="text-muted-foreground text-[11px]">{centerLabel}</span>
      </div>
    </div>
  )
}

/** Horizontal ranked bar list — labels + proportional bar + value (used for "top N" data). */
function RankedBarList({
  data,
  color,
}: {
  data: { name: string; count: number }[]
  color: string
}) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="space-y-3.5">
      {data.map((d) => (
        <div key={d.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate pr-2">{d.name}</span>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">{d.count}</span>
          </div>
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Chart configs (drive labels + legend text via shadcn chart primitives) ──

const growthConfig = {
  users: { label: 'Total users', color: C1 },
  active: { label: 'Active users', color: C2 },
} satisfies ChartConfig

const engagementConfig = {
  posts: { label: 'Posts', color: C1 },
  comments: { label: 'Comments', color: C2 },
  reactions: { label: 'Reactions', color: C3 },
} satisfies ChartConfig

const activityConfig = {
  siteActivity: { label: 'Logins & actions', color: C1 },
  contentActivity: { label: 'Posts, comments & reactions', color: C2 },
} satisfies ChartConfig

// ── Page ─────────────────────────────────────────────────────────────────────

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
      const cutoff = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const total = users.filter((u) => new Date(u.createdAt) < cutoff).length
      const active = users.filter((u) => new Date(u.createdAt) < cutoff && u.active).length
      last6.push({ month: months[d.getMonth()], users: total, active })
    }
    return last6
  })()

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const engagementPerDay = (() => {
    if (!postStats) return []
    return postStats.postsPerDay.map((d, i) => ({
      day: formatDay(d.date),
      posts: d.count,
      comments: postStats.commentsPerDay[i]?.count ?? 0,
      reactions: postStats.reactionsPerDay[i]?.count ?? 0,
    }))
  })()

  const activityByHourData = Array.from({ length: 24 }, (_, h) => ({
    hourLabel: formatHour(h),
    hour: h,
    siteActivity: activityStats?.activityByHour.find((a) => a.hour === h)?.count ?? 0,
    contentActivity: postStats?.activityByHour.find((a) => a.hour === h)?.count ?? 0,
  }))

  const peakHour = activityByHourData.reduce(
    (best, cur) =>
      cur.siteActivity + cur.contentActivity > best.siteActivity + best.contentActivity
        ? cur
        : best,
    activityByHourData[0]
  )

  const reactionsDonutData = (postStats?.reactionsByType ?? []).map((r, i) => ({
    name: `${r.emoji} ${r.name}`,
    value: r.count,
    fill: PALETTE[i % PALETTE.length],
  }))
  const reactionsConfig: ChartConfig = Object.fromEntries(
    reactionsDonutData.map((d) => [d.name, { label: d.name, color: d.fill }])
  )

  const postsByTypeData = (postStats?.postsByType ?? []).map((p) => ({
    name: titleCase(p.name),
    count: p.count,
  }))

  const projectsDonutData = (orgStats?.projectsByStatus ?? []).map((p, i) => ({
    name: titleCase(p.name),
    value: p.count,
    fill: PALETTE[i % PALETTE.length],
  }))
  const projectsConfig: ChartConfig = Object.fromEntries(
    projectsDonutData.map((d) => [d.name, { label: d.name, color: d.fill }])
  )

  const teamsByDepartmentData = (orgStats?.teamsByDepartment ?? [])
    .slice(0, 8)
    .map((t) => ({ name: t.name, count: t.count }))

  const metrics = [
    {
      title: 'Users',
      value: loading ? '' : users.length.toString(),
      change: `${activeUsers.length} active`,
      icon: Users,
      color: C1,
    },
    {
      title: 'Posts',
      value: loading ? '' : postStats ? postStats.totalPosts.toString() : '—',
      change: postStats ? `${postStats.postsToday} today` : 'Restricted',
      icon: FileText,
      color: C2,
    },
    {
      title: 'Comments',
      value: loading ? '' : postStats ? postStats.totalComments.toString() : '—',
      change: postStats ? `${postStats.avgCommentsPerPost} avg / post` : 'Restricted',
      icon: MessageSquare,
      color: C3,
    },
    {
      title: 'Reactions',
      value: loading ? '' : postStats ? postStats.totalReactions.toString() : '—',
      change: postStats ? `${postStats.avgReactionsPerPost} avg / post` : 'Restricted',
      icon: Heart,
      color: C4,
    },
    {
      title: 'Departments',
      value: loading ? '' : orgStats ? orgStats.totalDepartments.toString() : '—',
      change: orgStats ? `${orgStats.activeDepartments} active` : 'Restricted',
      icon: Building2,
      color: C5,
    },
    {
      title: 'Teams',
      value: loading ? '' : orgStats ? orgStats.totalTeams.toString() : '—',
      change: orgStats ? `${orgStats.avgMembersPerTeam} avg members` : 'Restricted',
      icon: UsersRound,
      color: C1,
    },
    {
      title: 'Projects',
      value: loading ? '' : orgStats ? orgStats.totalProjects.toString() : '—',
      change: orgStats ? `${orgStats.avgTeamsPerDepartment} teams / dept` : 'Restricted',
      icon: FolderKanban,
      color: C2,
    },
    {
      title: 'Roles',
      value: loading ? '' : roles.length.toString(),
      change: `${roles.reduce((sum, r) => sum + r.permissions.length, 0)} permissions`,
      icon: ShieldCheck,
      color: C3,
    },
  ]

  return (
    <div className="space-y-10 p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
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
        <div className="border-border bg-muted/40 flex items-start gap-2.5 rounded-lg border p-3.5 text-sm">
          <ShieldAlert className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-muted-foreground">
            Some sections ({restrictedSections.join(', ')}) require CEO or HR back-office access and
            could not be loaded for your role.
          </p>
        </div>
      )}

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.title} {...m} loading={loading} />
        ))}
      </div>

      {/* ── Community engagement ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeading
          icon={Sparkles}
          title="Community Engagement"
          description="Posts, comments, and reactions across the workspace"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            icon={Users}
            color={C1}
            title="User Growth"
            description="Total vs. active users, last 6 months"
          >
            <ChartContainer config={growthConfig} className="h-72 w-full">
              <AreaChart data={userGrowthData} margin={{ left: -16, right: 8 }}>
                <defs>
                  <linearGradient id="gradUsersTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C1} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={C1} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradUsersActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C2} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={C2} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-border/60"
                />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} />
                <YAxis tickLine={false} axisLine={false} tick={axisTick} width={32} />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke={C1}
                  strokeWidth={2}
                  fill="url(#gradUsersTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="active"
                  stroke={C2}
                  strokeWidth={2}
                  fill="url(#gradUsersActive)"
                />
              </AreaChart>
            </ChartContainer>
          </ChartCard>

          <ChartCard
            icon={FileText}
            color={C2}
            title="Posts, Comments & Reactions"
            description="Daily activity, last 14 days"
          >
            {postStats ? (
              <ChartContainer config={engagementConfig} className="h-72 w-full">
                <AreaChart data={engagementPerDay} margin={{ left: -16, right: 8 }}>
                  <defs>
                    <linearGradient id="gradPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C1} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C1} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradComments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C2} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C2} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradReactions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C3} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C3} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    className="stroke-border/60"
                  />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={axisTick} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTick} width={32} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="posts"
                    stroke={C1}
                    strokeWidth={2}
                    fill="url(#gradPosts)"
                  />
                  <Area
                    type="monotone"
                    dataKey="comments"
                    stroke={C2}
                    strokeWidth={2}
                    fill="url(#gradComments)"
                  />
                  <Area
                    type="monotone"
                    dataKey="reactions"
                    stroke={C3}
                    strokeWidth={2}
                    fill="url(#gradReactions)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyState loading={loading} />
            )}
          </ChartCard>

          <ChartCard
            icon={Heart}
            color={C4}
            title="Reactions by Type"
            description="How people react to content"
          >
            {postStats && reactionsDonutData.length > 0 ? (
              <DonutChart
                data={reactionsDonutData}
                config={reactionsConfig}
                centerLabel="reactions"
              />
            ) : (
              <EmptyState loading={loading} />
            )}
          </ChartCard>

          <ChartCard
            icon={FileText}
            color={C5}
            title="Posts by Type"
            description="Announcements, discussions, questions & more"
          >
            {postStats && postsByTypeData.length > 0 ? (
              <ChartContainer config={engagementConfig} className="h-72 w-full">
                <BarChart data={postsByTypeData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    className="stroke-border/60"
                  />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={axisTick} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tickLine={false}
                    axisLine={false}
                    tick={axisTick}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--muted)' }}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="count" fill={C5} radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState loading={loading} />
            )}
          </ChartCard>
        </div>
      </div>

      {/* ── Website activity ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeading
          icon={Clock}
          title="Hours of Activity"
          description="When people actually use the platform"
        />
        <ChartCard
          icon={Flame}
          color={C1}
          title="Activity by Hour of Day"
          description="Logins & account actions vs. content activity, last 30 days"
          action={
            activityByHourData.some((h) => h.siteActivity + h.contentActivity > 0) ? (
              <div
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ backgroundColor: tint(C1, 12), color: C1 }}
              >
                <Flame className="h-3 w-3" />
                Peak {peakHour.hourLabel}
              </div>
            ) : undefined
          }
        >
          {activityStats || postStats ? (
            <ChartContainer config={activityConfig} className="h-72 w-full">
              <AreaChart data={activityByHourData} margin={{ left: -16, right: 8 }}>
                <defs>
                  <linearGradient id="gradSiteActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C1} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={C1} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="gradContentActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C2} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={C2} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-border/60"
                />
                <XAxis
                  dataKey="hourLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={axisTick}
                  interval={2}
                />
                <YAxis tickLine={false} axisLine={false} tick={axisTick} width={32} />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="siteActivity"
                  stroke={C1}
                  strokeWidth={2}
                  fill="url(#gradSiteActivity)"
                />
                <Area
                  type="monotone"
                  dataKey="contentActivity"
                  stroke={C2}
                  strokeWidth={2}
                  fill="url(#gradContentActivity)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <EmptyState loading={loading} />
          )}
        </ChartCard>
      </div>

      {/* ── Organization ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeading
          icon={Building2}
          title="Organization"
          description="Departments, teams, and project delivery"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            icon={UsersRound}
            color={C3}
            title="Teams by Department"
            description="Where teams are concentrated"
          >
            {orgStats && teamsByDepartmentData.length > 0 ? (
              <RankedBarList data={teamsByDepartmentData} color={C3} />
            ) : (
              <EmptyState loading={loading} />
            )}
          </ChartCard>

          <ChartCard
            icon={FolderKanban}
            color={C5}
            title="Projects by Status"
            description="Planning through completion"
          >
            {orgStats && projectsDonutData.length > 0 ? (
              <DonutChart data={projectsDonutData} config={projectsConfig} centerLabel="projects" />
            ) : (
              <EmptyState loading={loading} />
            )}
          </ChartCard>
        </div>
      </div>

      {/* ── Recent activity ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          icon={Users}
          color={C1}
          title="Recently Joined Users"
          description="Newest members"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : recentUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users found.</p>
          ) : (
            <div className="space-y-1">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ backgroundColor: tint(C1, 16), color: C1 }}
                    >
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium">
                      {user.active ? (
                        <span style={{ color: C3 }}>Active</span>
                      ) : (
                        <span className="text-muted-foreground">Inactive</span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard
          icon={ShieldCheck}
          color={C2}
          title="Top Audit Actions"
          description="Most frequent account & security events, last 30 days"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : activityStats && activityStats.topActions.length > 0 ? (
            <RankedBarList
              data={activityStats.topActions.map((a) => ({
                name: titleCase(a.name),
                count: a.count,
              }))}
              color={C2}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              No audit activity available for your role.
            </p>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
