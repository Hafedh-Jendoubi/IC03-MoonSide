'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { Loader2, Users, Check, X, UserX, UserPlus, Search, SearchX } from 'lucide-react'
import { connectionApi, ConnectionResponse, UserSummaryResponse } from '@/lib/api'
import { emitConnectionsUpdated } from '@/lib/connection-events'

/** People shown per page once a list grows past one page. */
const PAGE_SIZE = 8

function initials(u: UserSummaryResponse) {
  const f = u.firstName?.[0] ?? ''
  const l = u.lastName?.[0] ?? ''
  return (f + l).toUpperCase() || u.email?.[0]?.toUpperCase() || '?'
}

function fullName(u: UserSummaryResponse) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return name || u.email || 'Unknown user'
}

function matchesQuery(u: UserSummaryResponse, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [fullName(u), u.email, u.jobTitle].some((field) => field?.toLowerCase().includes(q))
}

/** Formats an ISO date string as e.g. "Jan 5, 2024"; returns null if missing/invalid. */
function formatDate(dateStr?: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function PersonRow({
  user,
  subtitle,
  actions,
  dateLabel,
}: {
  user: UserSummaryResponse
  subtitle?: string
  actions?: React.ReactNode
  dateLabel?: string | null
}) {
  return (
    <div className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg border border-transparent p-3 transition-colors">
      <Link href={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-11 w-11">
          {user.avatar && <AvatarImage src={user.avatar} alt={fullName(user)} />}
          <AvatarFallback>{initials(user)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{fullName(user)}</p>
          <p className="text-muted-foreground truncate text-sm">
            {subtitle ?? user.jobTitle ?? ''}
          </p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-4">
        {dateLabel && (
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            Connected: {dateLabel}
          </span>
        )}
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center">
      {icon}
      <p>{text}</p>
    </div>
  )
}

/** Builds a compact page-number sequence with ellipses, e.g. 1 … 4 5 6 … 12 */
function pageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const withEllipses: (number | 'ellipsis')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) withEllipses.push('ellipsis')
    withEllipses.push(p)
  })
  return withEllipses
}

/**
 * Shared search-filter + pagination logic for a tab's list.
 * `getUser` extracts the person to match/display from each item, since
 * "connections" holds UserSummaryResponse directly while "received"/"sent"
 * hold ConnectionResponse wrappers.
 */
function usePeopleFilter<T>(items: T[], getUser: (item: T) => UserSummaryResponse | undefined) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const u = getUser(item)
      return !!u && matchesQuery(u, query)
    })
  }, [items, query, getUser])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  )

  const setQueryAndReset = useCallback((q: string) => {
    setQuery(q)
    setPage(1)
  }, [])

  return {
    query,
    setQuery: setQueryAndReset,
    page: safePage,
    setPage,
    totalPages,
    filteredCount: filtered.length,
    paged,
  }
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative mb-3">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        size={16}
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}

function ListPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page === 1}
            className={page === 1 ? 'pointer-events-none opacity-50' : ''}
            onClick={(e) => {
              e.preventDefault()
              if (page > 1) onPageChange(page - 1)
            }}
          />
        </PaginationItem>
        {pageNumbers(page, totalPages).map((p, i) =>
          p === 'ellipsis' ? (
            <PaginationEllipsis key={`e-${i}`} />
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(p)
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page === totalPages}
            className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
            onClick={(e) => {
              e.preventDefault()
              if (page < totalPages) onPageChange(page + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

/** Renders one tab's body: empty state, search box, paginated rows, pagination bar. */
function PeopleTabBody<T>({
  items,
  getUser,
  emptyIcon,
  emptyText,
  searchPlaceholder,
  renderActions,
}: {
  items: T[]
  getUser: (item: T) => UserSummaryResponse | undefined
  emptyIcon: React.ReactNode
  emptyText: string
  searchPlaceholder: string
  renderActions?: (item: T) => {
    subtitle?: string
    actions?: React.ReactNode
    dateLabel?: string | null
  }
}) {
  const filter = usePeopleFilter(items, getUser)

  if (items.length === 0) {
    return <EmptyState icon={emptyIcon} text={emptyText} />
  }

  return (
    <div className="p-1">
      <SearchBox value={filter.query} onChange={filter.setQuery} placeholder={searchPlaceholder} />
      {filter.filteredCount === 0 ? (
        <EmptyState icon={<SearchX size={32} />} text="No one matches your search." />
      ) : (
        <div className="divide-y">
          {filter.paged.map((item, idx) => {
            const user = getUser(item)
            if (!user) return null
            const extra = renderActions?.(item) ?? {}
            return <PersonRow key={user.id ?? idx} user={user} {...extra} />
          })}
        </div>
      )}
      <ListPagination
        page={filter.page}
        totalPages={filter.totalPages}
        onPageChange={filter.setPage}
      />
    </div>
  )
}

export default function ConnectionsPage() {
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<ConnectionResponse[]>([])
  const [received, setReceived] = useState<ConnectionResponse[]>([])
  const [sent, setSent] = useState<ConnectionResponse[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    try {
      const [conns, recv, snt] = await Promise.all([
        connectionApi.getMyConnections(),
        connectionApi.getPendingReceived(),
        connectionApi.getPendingSent(),
      ])
      setConnections(conns)
      setReceived(recv)
      setSent(snt)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your network')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const withBusy = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id)
    try {
      await action()
      await loadAll()
      emitConnectionsUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusyId(null)
    }
  }

  const getUserFromConnection = useCallback((c: ConnectionResponse) => c.otherUser ?? undefined, [])

  return (
    <AuthLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Users className="text-primary" size={28} />
          <div>
            <h1 className="text-2xl font-bold">My Network</h1>
            <p className="text-muted-foreground text-sm">
              Manage your connections and connection requests
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : (
          <Tabs defaultValue="connections">
            <TabsList>
              <TabsTrigger value="connections">Connections ({connections.length})</TabsTrigger>
              <TabsTrigger value="received">
                Received {received.length > 0 && `(${received.length})`}
              </TabsTrigger>
              <TabsTrigger value="sent">Sent {sent.length > 0 && `(${sent.length})`}</TabsTrigger>
            </TabsList>

            <TabsContent value="connections">
              <Card className="p-2">
                <PeopleTabBody
                  items={connections}
                  getUser={getUserFromConnection}
                  emptyIcon={<Users size={36} />}
                  emptyText="You haven't connected with anyone yet."
                  searchPlaceholder="Search your connections by name, email, or title..."
                  renderActions={(c) => ({
                    dateLabel: formatDate(c.respondedAt ?? c.createdAt),
                  })}
                />
              </Card>
            </TabsContent>

            <TabsContent value="received">
              <Card className="p-2">
                <PeopleTabBody
                  items={received}
                  getUser={getUserFromConnection}
                  emptyIcon={<UserPlus size={36} />}
                  emptyText="No pending connection requests."
                  searchPlaceholder="Search pending requests by name, email, or title..."
                  renderActions={(c) => ({
                    subtitle: 'Wants to connect with you',
                    actions: (
                      <>
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 text-white hover:bg-green-700"
                          disabled={busyId === c.id}
                          onClick={() => withBusy(c.id, () => connectionApi.accept(c.id))}
                        >
                          {busyId === c.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === c.id}
                          onClick={() => withBusy(c.id, () => connectionApi.decline(c.id))}
                        >
                          <X size={14} />
                        </Button>
                      </>
                    ),
                  })}
                />
              </Card>
            </TabsContent>

            <TabsContent value="sent">
              <Card className="p-2">
                <PeopleTabBody
                  items={sent}
                  getUser={getUserFromConnection}
                  emptyIcon={<UserPlus size={36} />}
                  emptyText="You have no pending sent requests."
                  searchPlaceholder="Search sent requests by name, email, or title..."
                  renderActions={(c) => ({
                    subtitle: 'Request pending',
                    actions: (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        disabled={busyId === c.id}
                        onClick={() => withBusy(c.id, () => connectionApi.remove(c.id))}
                      >
                        {busyId === c.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <UserX size={14} />
                        )}
                        Cancel
                      </Button>
                    ),
                  })}
                />
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AuthLayout>
  )
}
