'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Search, ChevronDown, ChevronUp, Award } from 'lucide-react'
import { badgeApi } from '@/lib/api'
import type { BadgeDefinition, BadgeCategory } from '@/lib/api'
import { BadgeIcon } from '@/components/badge-icon'

// ── Colour theme per category ─────────────────────────────────────────────────
const CATEGORY_THEME: Record<string, { bg: string; icon: string; border: string; pill: string }> = {
  PROFILE: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    icon: 'text-violet-500',
    border: 'border-violet-200 dark:border-violet-800',
    pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  },
  CONTENT: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'text-blue-500',
    border: 'border-blue-200 dark:border-blue-800',
    pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  NETWORK: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'text-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-800',
    pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  },
  ENGAGEMENT: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    icon: 'text-orange-500',
    border: 'border-orange-200 dark:border-orange-800',
    pill: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
}

function initials(firstName?: string | null, lastName?: string | null) {
  return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase() || '?'
}

function fullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ') || 'Unknown user'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ── Holder list (collapsed / expanded) ────────────────────────────────────────
function HolderList({ holders }: { holders: BadgeDefinition['holders'] }) {
  const [expanded, setExpanded] = useState(false)
  if (!holders || holders.length === 0) {
    return (
      <p className="text-muted-foreground mt-3 text-xs italic">
        No one has earned this badge yet — be the first!
      </p>
    )
  }

  const visible = expanded ? holders : holders.slice(0, 5)

  return (
    <div className="mt-3">
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
        Earned by {holders.length} {holders.length === 1 ? 'person' : 'people'}
      </p>
      <ul className="space-y-2">
        {visible.map((h) => (
          <li key={h.userId}>
            <Link
              href={`/profile/${h.userId}`}
              className="hover:bg-muted/60 flex items-center gap-2 rounded-lg p-1.5 transition-colors"
            >
              <Avatar className="h-7 w-7 shrink-0">
                {h.avatar && <AvatarImage src={h.avatar} alt={fullName(h.firstName, h.lastName)} />}
                <AvatarFallback className="text-[10px]">
                  {initials(h.firstName, h.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{fullName(h.firstName, h.lastName)}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {h.jobTitle ? `${h.jobTitle} · ` : ''}
                  {formatDate(h.awardedAt)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {holders.length > 5 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-primary mt-2 flex items-center gap-1 text-xs font-medium hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp size={13} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={13} /> Show {holders.length - 5} more
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ── Badge card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge }: { badge: BadgeDefinition }) {
  const theme = CATEGORY_THEME[badge.category] ?? CATEGORY_THEME.CONTENT
  const [open, setOpen] = useState(false)

  return (
    <Card
      className={`overflow-hidden border transition-shadow hover:shadow-md ${theme.border} ${badge.earned ? '' : 'opacity-60'}`}
    >
      {/* Header */}
      <div className={`flex items-start gap-4 p-5 ${theme.bg}`}>
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/60 shadow-sm dark:bg-black/20`}
        >
          <BadgeIcon name={badge.icon} size={28} className={theme.icon} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{badge.displayName}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${theme.pill}`}
            >
              {badge.category.charAt(0) + badge.category.slice(1).toLowerCase()}
            </span>
            {badge.earned && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-green-700 uppercase dark:bg-green-900 dark:text-green-300">
                ✓ Earned
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm leading-snug">{badge.description}</p>
        </div>
      </div>

      {/* Holders toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="hover:bg-muted/40 flex w-full items-center justify-between border-t px-5 py-2.5 text-left transition-colors"
      >
        <span className="text-muted-foreground text-xs font-medium">
          {badge.holderCount === 0
            ? 'No holders yet'
            : `${badge.holderCount} holder${badge.holderCount !== 1 ? 's' : ''}`}
        </span>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-4">
          <HolderList holders={badge.holders ?? []} />
        </div>
      )}
    </Card>
  )
}

// ── Category stats strip ──────────────────────────────────────────────────────
function CategoryStats({ badges }: { badges: BadgeDefinition[] }) {
  const total = badges.length
  const earned = badges.filter((b) => b.earned).length
  const pct = total ? Math.round((earned / total) * 100) : 0

  const byCat = (['PROFILE', 'CONTENT', 'NETWORK', 'ENGAGEMENT'] as const).map((cat) => ({
    cat,
    total: badges.filter((b) => b.category === cat).length,
    earned: badges.filter((b) => b.category === cat && b.earned).length,
    theme: CATEGORY_THEME[cat],
  }))

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {byCat.map(({ cat, total: t, earned: e, theme }) => (
        <div key={cat} className={`rounded-xl border p-4 ${theme.bg} ${theme.border}`}>
          <p className={`text-xs font-semibold tracking-wide uppercase ${theme.icon}`}>
            {cat.charAt(0) + cat.slice(1).toLowerCase()}
          </p>
          <p className="mt-1 text-2xl font-bold">
            {e}
            <span className="text-muted-foreground text-base font-normal">/{t}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<BadgeCategory>('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    badgeApi
      .getMyBadges()
      .then((data) => {
        // getMyBadges returns definitions without holder lists; merge holders from getAllBadges
        return badgeApi.getAllBadges().then((all) => {
          const holderMap = Object.fromEntries(all.map((b) => [b.key, b]))
          return data.map((d) => ({
            ...d,
            holders: holderMap[d.key]?.holders ?? [],
            holderCount: holderMap[d.key]?.holderCount ?? 0,
          }))
        })
      })
      .then((merged) => {
        setBadges(merged)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    let list = badges
    if (activeTab !== 'ALL') list = list.filter((b) => b.category === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (b) => b.displayName.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
      )
    }
    // Earned badges first, then alphabetical
    return [...list].sort((a, b) => {
      if (a.earned !== b.earned) return a.earned ? -1 : 1
      return a.displayName.localeCompare(b.displayName)
    })
  }, [badges, activeTab, search])

  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <AuthLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Earn badges by engaging with the platform. You have collected{' '}
              <span className="text-foreground font-semibold">{earnedCount}</span> of{' '}
              <span className="text-foreground font-semibold">{badges.length}</span> badges.
            </p>
          </div>

          {/* Progress pill */}
          {badges.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${(earnedCount / badges.length) * 100}%` }}
                />
              </div>
              <span className="text-muted-foreground text-sm font-medium">
                {Math.round((earnedCount / badges.length) * 100)}%
              </span>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="text-primary animate-spin" size={36} />
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* ── Category stats ─────────────────────────────────────────── */}
            <CategoryStats badges={badges} />

            {/* ── Filter bar ─────────────────────────────────────────────── */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BadgeCategory)}>
                <TabsList>
                  <TabsTrigger value="ALL">All</TabsTrigger>
                  <TabsTrigger value="PROFILE">Profile</TabsTrigger>
                  <TabsTrigger value="CONTENT">Content</TabsTrigger>
                  <TabsTrigger value="NETWORK">Network</TabsTrigger>
                  <TabsTrigger value="ENGAGEMENT">Engagement</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative max-w-xs flex-1 sm:flex-none">
                <Search
                  size={14}
                  className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                />
                <Input
                  placeholder="Search badges…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {/* ── Badge grid ─────────────────────────────────────────────── */}
            {filtered.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center gap-2 py-20 text-center">
                <Award size={40} className="opacity-30" />
                <p className="font-medium">No badges found</p>
                <p className="text-sm">Try adjusting your search or filter.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {filtered.map((badge) => (
                  <BadgeCard key={badge.key} badge={badge} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  )
}
