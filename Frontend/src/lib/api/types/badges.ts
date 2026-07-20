export interface HolderSummary {
  userId: string
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
  jobTitle?: string | null
  awardedAt: string
}

export interface BadgeDefinition {
  key: string
  displayName: string
  description: string
  icon: string
  category: 'PROFILE' | 'CONTENT' | 'NETWORK' | 'ENGAGEMENT'
  earned: boolean
  holderCount: number
  holders: HolderSummary[]
}

export interface UserBadge {
  id: string
  userId: string
  badgeKey: string
  displayName: string
  description: string
  icon: string
  category: string
  awardedAt: string
}

export type BadgeCategory = 'ALL' | 'PROFILE' | 'CONTENT' | 'NETWORK' | 'ENGAGEMENT'
