// ── Shared small shapes ──────────────────────────────────────────────────────

export interface DailyCount {
  date: string // yyyy-MM-dd
  count: number
}

export interface HourlyCount {
  hour: number // 0-23
  count: number
}

export interface NamedCount {
  name: string
  count: number
}

// ── Post-Service: /posts/stats ───────────────────────────────────────────────

export interface ReactionBreakdown {
  code: string
  emoji: string
  name: string
  count: number
}

export interface PostStats {
  totalPosts: number
  totalComments: number
  totalReactions: number
  postsToday: number
  commentsToday: number
  reactionsToday: number
  avgCommentsPerPost: number
  avgReactionsPerPost: number
  postsPerDay: DailyCount[]
  commentsPerDay: DailyCount[]
  reactionsPerDay: DailyCount[]
  activityByHour: HourlyCount[]
  postsByType: NamedCount[]
  reactionsByType: ReactionBreakdown[]
}

// ── Organization-Service: /organizations/stats ──────────────────────────────

export interface OrgStats {
  totalDepartments: number
  activeDepartments: number
  inactiveDepartments: number
  totalTeams: number
  independentTeams: number
  totalProjects: number
  avgTeamsPerDepartment: number
  avgMembersPerTeam: number
  projectsByStatus: NamedCount[]
  teamsByDepartment: NamedCount[]
  departmentsCreatedPerDay: DailyCount[]
  teamsCreatedPerDay: DailyCount[]
  projectsCreatedPerDay: DailyCount[]
}
