'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartLegend } from '@/components/ui/chart'
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
import { Users, MessageSquare, Heart, TrendingUp, Loader2 } from 'lucide-react'
import { userApi, roleApi, UserResponse, RoleResponse } from '@/lib/api'

// Static chart data (no posts service yet)
const postsPerDayData = [
  { day: 'Mon', posts: 12, comments: 24 },
  { day: 'Tue', posts: 18, comments: 31 },
  { day: 'Wed', posts: 14, comments: 28 },
  { day: 'Thu', posts: 22, comments: 35 },
  { day: 'Fri', posts: 25, comments: 42 },
  { day: 'Sat', posts: 19, comments: 33 },
  { day: 'Sun', posts: 16, comments: 29 },
]

const engagementData = [
  { name: 'Likes', value: 45, fill: '#3b82f6' },
  { name: 'Comments', value: 30, fill: '#8b5cf6' },
  { name: 'Shares', value: 15, fill: '#ec4899' },
  { name: 'Views', value: 10, fill: '#f59e0b' },
]

const chartConfig = {
  users: { label: 'Total Users', color: 'hsl(var(--chart-1))' },
  active: { label: 'Active Users', color: 'hsl(var(--chart-2))' },
  posts: { label: 'Posts', color: 'hsl(var(--chart-1))' },
  comments: { label: 'Comments', color: 'hsl(var(--chart-2))' },
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersData, rolesData] = await Promise.all([userApi.getAll(), roleApi.getAll()])
      setUsers(usersData)
      setRoles(rolesData)
    } catch {
      // silently fail – dashboard still renders with partial data
    } finally {
      setLoading(false)
    }
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

  // Top users by earliest joiners (real data – posts not available yet)
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const metrics = [
    {
      title: 'Total Users',
      value: loading ? '—' : users.length.toString(),
      change: `${activeUsers.length} active`,
      icon: Users,
    },
    {
      title: 'Active Users',
      value: loading ? '—' : activeUsers.length.toString(),
      change:
        users.length > 0
          ? `${Math.round((activeUsers.length / users.length) * 100)}% of total`
          : '—',
      icon: TrendingUp,
    },
    {
      title: 'Roles',
      value: loading ? '—' : roles.length.toString(),
      change: `${roles.reduce((sum, r) => sum + r.permissions.length, 0)} total permissions`,
      icon: MessageSquare,
    },
    {
      title: 'Inactive Users',
      value: loading ? '—' : (users.length - activeUsers.length).toString(),
      change: 'Accounts deactivated',
      icon: Heart,
    },
  ]

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the admin dashboard. Track key metrics and user activities.
        </p>
      </div>

      {loading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading live data…
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

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart (real data) */}
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
                  <XAxis dataKey="month" stroke="currentColor" className="text-muted-foreground" />
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

        {/* Posts & Comments Chart */}
        <Card className="dark:border-slate-700">
          <CardHeader>
            <CardTitle>Posts & Comments</CardTitle>
            <CardDescription>Weekly activity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={postsPerDayData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
                  <XAxis dataKey="day" stroke="currentColor" className="text-muted-foreground" />
                  <YAxis stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="posts" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="comments" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Engagement Distribution */}
        <Card className="dark:border-slate-700">
          <CardHeader>
            <CardTitle>Engagement Distribution</CardTitle>
            <CardDescription>Types of user interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {engagementData.map((entry, index) => (
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
          </CardContent>
        </Card>

        {/* Recently Joined Users (real data) */}
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
      </div>
    </div>
  )
}
