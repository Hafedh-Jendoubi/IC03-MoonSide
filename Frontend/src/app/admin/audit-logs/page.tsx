'use client'

import { useEffect, useState, useCallback } from 'react'
import { auditApi, AuditLogResponse, AuditLogStats, PageResponse } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ShieldCheck,
  ShieldX,
  Activity,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Eye,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { RoleGuard } from '@/components/role-guard'
import { ROLE } from '@/lib/types'

// -- Action badge colour map ---------------------------------------------------

const ACTION_COLORS: Record<string, string> = {
  // User Service actions
  LOGIN_SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  LOGIN_FAILURE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  REGISTER_SUCCESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  REGISTER_FAILURE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  EMAIL_VERIFY_SUCCESS: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  EMAIL_VERIFY_FAILURE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PASSWORD_RESET_REQUEST: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PASSWORD_RESET_SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  TWO_FA_ENABLED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  TWO_FA_DISABLED: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  TWO_FA_VERIFY_SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  TWO_FA_VERIFY_FAILURE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PROFILE_UPDATE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  AVATAR_UPDATE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  AVATAR_DELETE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  ROLE_ASSIGNED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  ROLE_REVOKED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  USER_DEACTIVATED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  USER_ACTIVATED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  USER_DELETED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  // Organization Service actions
  DEPARTMENT_CREATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  DEPARTMENT_UPDATED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  DEPARTMENT_DELETED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  DEPARTMENT_ACTIVATED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  DEPARTMENT_DEACTIVATED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  DEPARTMENT_MANAGER_ASSIGNED:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  DEPARTMENT_MANAGER_REMOVED:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  TEAM_CREATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  TEAM_UPDATED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  TEAM_DELETED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  TEAM_LEAD_ASSIGNED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  TEAM_LEAD_REMOVED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  TEAM_MEMBER_ADDED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  TEAM_MEMBER_REMOVED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  TEAM_MEMBER_ASSIGNED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  BANNER_UPDATE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  BANNER_DELETE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
}

const ALL_ACTIONS = Object.keys(ACTION_COLORS)

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), 'MMM d, yyyy HH:mm:ss')
  } catch {
    return iso
  }
}

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] ?? 'bg-slate-100 text-slate-700'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {action.replace(/_/g, ' ')}
    </span>
  )
}

// -- Detail dialog -------------------------------------------------------------

function DetailDialog({ log, onClose }: { log: AuditLogResponse | null; onClose: () => void }) {
  if (!log) return null
  const rows: [string, string | null][] = [
    ['ID', log.id],
    ['Action', log.action],
    ['Description', log.description],
    ['Entity Type', log.entityType],
    ['Entity ID', log.entityId],
    ['User ID', log.userId],
    ['IP Address', log.ipAddress],
    ['Timestamp', fmtDate(log.createdAt)],
  ]
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye size={18} />
            Audit Log Detail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            {log.success ? (
              <CheckCircle2 size={16} className="text-green-500" />
            ) : (
              <XCircle size={16} className="text-red-500" />
            )}
            <span className="text-sm font-medium">{log.success ? 'Success' : 'Failure'}</span>
            <ActionBadge action={log.action} />
          </div>

          {/* Metadata grid */}
          <div className="rounded-md border">
            <Table>
              <TableBody>
                {rows.map(([label, value]) => (
                  <TableRow key={label}>
                    <TableCell className="text-muted-foreground w-36 font-medium">
                      {label}
                    </TableCell>
                    <TableCell className="font-mono text-xs break-all">{value ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Old / New value snapshots */}
          {(log.oldValue || log.newValue) && (
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Before', log.oldValue],
                ['After', log.newValue],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                    {label}
                  </p>
                  <pre className="bg-muted max-h-48 overflow-auto rounded-md p-3 text-xs break-all whitespace-pre-wrap">
                    {val
                      ? (() => {
                          try {
                            return JSON.stringify(JSON.parse(val), null, 2)
                          } catch {
                            return val
                          }
                        })()
                      : '—'}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// -- Main page -----------------------------------------------------------------

const PAGE_SIZE = 20

export default function AuditLogsPage() {
  return (
    <RoleGuard requiredRoles={ROLE.CEO}>
      <AuditLogsPageContent />
    </RoleGuard>
  )
}

function AuditLogsPageContent() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<AuditLogResponse> | null>(null)
  const [stats, setStats] = useState<AuditLogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<AuditLogResponse | null>(null)

  // Filters
  const [userIdInput, setUserIdInput] = useState('')
  const [userId, setUserId] = useState('')
  const [action, setAction] = useState('ALL')
  const [successFilter, setSuccessFilter] = useState<'ALL' | 'true' | 'false'>('ALL')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Parameters<typeof auditApi.getLogs>[0] = {
        page: 0, // Get all pages for merging
        size: 1000, // Large size to get comprehensive data
      }
      if (userId) params.userId = userId
      if (action !== 'ALL') params.action = action
      if (successFilter !== 'ALL') params.success = successFilter === 'true'

      // Fetch from both User Service and Organization Service
      const [userLogsData, userStatsData, orgLogsData, orgStatsData] = await Promise.all([
        auditApi.getLogs(params).catch(() => null),
        auditApi.getStats().catch(() => null),
        auditApi.getOrgLogs(params).catch(() => null),
        auditApi.getOrgStats().catch(() => null),
      ])

      // Merge logs from both services
      const allLogs: AuditLogResponse[] = []
      if (userLogsData?.content) {
        allLogs.push(...userLogsData.content)
      }
      if (orgLogsData?.content) {
        allLogs.push(...orgLogsData.content)
      }

      // Sort by timestamp (descending)
      allLogs.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      })

      // Implement client-side pagination
      const start = page * PAGE_SIZE
      const end = start + PAGE_SIZE
      const paginatedLogs = allLogs.slice(start, end)
      const totalElements = allLogs.length
      const totalPages = Math.ceil(totalElements / PAGE_SIZE)

      const mergedData: PageResponse<AuditLogResponse> = {
        content: paginatedLogs,
        totalElements,
        totalPages,
        number: page,
        size: PAGE_SIZE,
      }

      // Merge stats from both services
      const mergedStats: AuditLogStats = {
        total: (userStatsData?.total ?? 0) + (orgStatsData?.total ?? 0),
        success: (userStatsData?.success ?? 0) + (orgStatsData?.success ?? 0),
        failure: (userStatsData?.failure ?? 0) + (orgStatsData?.failure ?? 0),
      }

      setData(mergedData)
      setStats(mergedStats)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, userId, action, successFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset page on filter change
  useEffect(() => {
    setPage(0)
  }, [userId, action, successFilter])

  function applyUserIdFilter() {
    setUserId(userIdInput.trim())
    setPage(0)
  }

  function clearFilters() {
    setUserIdInput('')
    setUserId('')
    setAction('ALL')
    setSuccessFilter('ALL')
    setPage(0)
  }

  const totalPages = data?.totalPages ?? 1

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* -- Header -- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground text-sm">
            Full trail of every action performed on the platform
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'mr-2 animate-spin' : 'mr-2'} />
          Refresh
        </Button>
      </div>

      {/* -- Stats cards -- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Events',
            value: stats?.total ?? '—',
            icon: Activity,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-950',
          },
          {
            label: 'Successful',
            value: stats?.success ?? '—',
            icon: ShieldCheck,
            color: 'text-green-500',
            bg: 'bg-green-50 dark:bg-green-950',
          },
          {
            label: 'Failed',
            value: stats?.failure ?? '—',
            icon: ShieldX,
            color: 'text-red-500',
            bg: 'bg-red-50 dark:bg-red-950',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
              <div className={`rounded-full p-2 ${bg}`}>
                <Icon size={16} className={color} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* -- Filters -- */}
      <div className="flex flex-wrap items-end gap-3">
        {/* User ID filter */}
        <div className="flex gap-2">
          <Input
            placeholder="Filter by User ID…"
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyUserIdFilter()}
            className="w-60"
          />
          <Button variant="secondary" size="icon" onClick={applyUserIdFilter}>
            <Search size={14} />
          </Button>
        </div>

        {/* Action filter */}
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Actions</SelectItem>
            {ALL_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Success filter */}
        <Select
          value={successFilter}
          onValueChange={(v) => setSuccessFilter(v as typeof successFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Outcomes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Outcomes</SelectItem>
            <SelectItem value="true">Success only</SelectItem>
            <SelectItem value="false">Failures only</SelectItem>
          </SelectContent>
        </Select>

        {(userId || action !== 'ALL' || successFilter !== 'ALL') && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* -- Table -- */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28">Entity</TableHead>
              <TableHead className="w-20 text-center">Status</TableHead>
              <TableHead className="w-14 text-center">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="text-muted-foreground mx-auto animate-spin" />
                </TableCell>
              </TableRow>
            ) : !data?.content.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-32 text-center">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              data.content.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/40">
                  <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                    {fmtDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm" title={log.description}>
                    {log.description}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {log.entityType ?? '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.success ? (
                      <CheckCircle2 size={16} className="mx-auto text-green-500" />
                    ) : (
                      <XCircle size={16} className="mx-auto text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDetail(log)}
                    >
                      <Eye size={13} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* -- Pagination -- */}
      {data && totalPages > 1 && (
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>
            Showing {data.number * PAGE_SIZE + 1}–
            {Math.min((data.number + 1) * PAGE_SIZE, data.totalElements)} of{' '}
            {data.totalElements.toLocaleString()} events
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="font-medium">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* -- Detail dialog -- */}
      <DetailDialog log={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
