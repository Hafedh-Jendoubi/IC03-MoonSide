'use client'

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
import { Users, MessageSquare, Heart, TrendingUp } from 'lucide-react'

// Mock data for charts
const userGrowthData = [
  { month: 'Jan', users: 120, active: 80 },
  { month: 'Feb', users: 180, active: 120 },
  { month: 'Mar', users: 250, active: 180 },
  { month: 'Apr', users: 380, active: 290 },
  { month: 'May', users: 480, active: 380 },
  { month: 'Jun', users: 620, active: 510 },
]

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

const metrics = [
  {
    title: 'Total Users',
    value: '620',
    change: '+12.5%',
    icon: Users,
  },
  {
    title: 'Posts Created',
    value: '126',
    change: '+8.2%',
    icon: TrendingUp,
  },
  {
    title: 'Comments',
    value: '222',
    change: '+15.3%',
    icon: MessageSquare,
  },
  {
    title: 'Engagement Rate',
    value: '68.5%',
    change: '+3.1%',
    icon: Heart,
  },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the admin dashboard. Track key metrics and user activities.
        </p>
      </div>

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
              <p className="text-muted-foreground text-xs">{change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card className="dark:border-slate-700">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Total and active users over time</CardDescription>
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

        {/* Activity Heatmap */}
        <Card className="dark:border-slate-700">
          <CardHeader>
            <CardTitle>Top Users</CardTitle>
            <CardDescription>Most active users this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'John Doe', posts: 45, comments: 89 },
                { name: 'Jane Smith', posts: 38, comments: 72 },
                { name: 'Alex Johnson', posts: 32, comments: 65 },
                { name: 'Maria Garcia', posts: 28, comments: 54 },
                { name: 'David Chen', posts: 22, comments: 41 },
              ].map((user) => (
                <div
                  key={user.name}
                  className="border-border flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {user.posts} posts • {user.comments} comments
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{user.posts + user.comments}</p>
                    <p className="text-muted-foreground text-xs">total activities</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
