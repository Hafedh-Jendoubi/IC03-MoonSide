'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Shield,
  Loader2,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit2,
  Mail,
  UserX,
  UserCheck,
  Trash2,
  X,
  UserPlus,
  SendHorizonal,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  userApi,
  roleApi,
  UserResponse,
  RoleResponse,
  InviteUserRequest,
  BulkInviteResult,
} from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { hasAnyPermission, PERM } from '@/lib/types'

// --- Avatar component ---------------------------------------------------------

function UserAvatar({ user, size = 'sm' }: { user: UserResponse; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={`${user.firstName} ${user.lastName}`}
        className={`${dim} rounded-full object-cover ring-2 ring-white dark:ring-slate-800`}
      />
    )
  }
  return (
    <div
      className={`${dim} bg-primary/10 text-primary flex flex-shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white dark:ring-slate-800`}
    >
      {user.firstName?.[0]?.toUpperCase()}
      {user.lastName?.[0]?.toUpperCase()}
    </div>
  )
}

// --- Dropdown action menu -----------------------------------------------------

interface DropdownMenuProps {
  user: UserResponse
  onView: () => void
  onEdit: () => void
  onContact: () => void
  onToggleActive: () => void
  onDelete: () => void
  canManage?: boolean
}

function ActionDropdown({
  user,
  onView,
  onEdit,
  onContact,
  onToggleActive,
  onDelete,
  canManage = false,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const action = (fn: () => void) => {
    fn()
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
        onClick={() => setOpen((v) => !v)}
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {open && (
        <div className="border-border bg-popover fixed right-0 z-50 mt-1 w-44 origin-top-right rounded-lg border shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900">
          <div className="text-popover-foreground py-1 text-sm">
            <button
              className="hover:bg-muted flex w-full items-center gap-2.5 px-3 py-2"
              onClick={() => action(onView)}
            >
              <Eye className="text-muted-foreground h-3.5 w-3.5" />
              View profile
            </button>
            {canManage && (
              <button
                className="hover:bg-muted flex w-full items-center gap-2.5 px-3 py-2"
                onClick={() => action(onEdit)}
              >
                <Edit2 className="text-muted-foreground h-3.5 w-3.5" />
                Edit
              </button>
            )}
            <button
              className="hover:bg-muted flex w-full items-center gap-2.5 px-3 py-2"
              onClick={() => action(onContact)}
            >
              <Mail className="text-muted-foreground h-3.5 w-3.5" />
              Contact
            </button>
            {canManage && (
              <>
                <div className="border-border my-1 border-t dark:border-slate-700" />
                <button
                  className={`hover:bg-muted flex w-full items-center gap-2.5 px-3 py-2 ${
                    user.active
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                  onClick={() => action(onToggleActive)}
                >
                  {user.active ? (
                    <UserX className="h-3.5 w-3.5" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5" />
                  )}
                  {user.active ? 'Block user' : 'Unblock user'}
                </button>
                <button
                  className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2.5 px-3 py-2"
                  onClick={() => action(onDelete)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main page ----------------------------------------------------------------

export default function UsersPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  // CEO can do everything; HR can only invite (single) and view
  const canBulkInvite = hasAnyPermission(currentUser, PERM.ANYTHING)
  const canManageUsers = hasAnyPermission(currentUser, PERM.ANYTHING) // deactivate/delete/edit
  const canEditRoles = hasAnyPermission(currentUser, PERM.ANYTHING) // assign/revoke roles
  const [users, setUsers] = useState<UserResponse[]>([])
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Edit user state
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', jobTitle: '', bio: '' })
  const [assignedRoleIds, setAssignedRoleIds] = useState<Set<string>>(new Set())
  const [originalRoleIds, setOriginalRoleIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  // Bulk invite state
  const [inviteTab, setInviteTab] = useState<'single' | 'bulk'>('single')
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkInviteResult | null>(null)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // User detail modal state
  const [viewingUser, setViewingUser] = useState<UserResponse | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersData, rolesData] = await Promise.all([userApi.getAll(), roleApi.getAll()])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && user.active) ||
        (filterStatus === 'inactive' && !user.active)
      return matchesSearch && matchesStatus
    })
  }, [users, searchQuery, filterStatus])

  const getRoleBadgeVariant = (
    roleNames: string[]
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (roleNames.length === 0) return 'outline'
    const first = roleNames[0].toLowerCase()
    if (first === 'admin') return 'default'
    if (first === 'manager') return 'secondary'
    return 'outline'
  }

  const openEdit = (user: UserResponse) => {
    setEditingUser(user)
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      jobTitle: user.jobTitle ?? '',
      bio: user.bio ?? '',
    })
    const ids = new Set(
      user.roles
        .map((name) => roles.find((r) => r.name === name)?.id)
        .filter((id): id is string => !!id)
    )
    setAssignedRoleIds(new Set(ids))
    setOriginalRoleIds(new Set(ids))
  }

  const toggleRole = (roleId: string) => {
    setAssignedRoleIds((prev) => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      await userApi.update(editingUser.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        jobTitle: editForm.jobTitle || undefined,
        bio: editForm.bio || undefined,
      })
      const toAssign = [...assignedRoleIds].filter((id) => !originalRoleIds.has(id))
      const toRevoke = [...originalRoleIds].filter((id) => !assignedRoleIds.has(id))
      await Promise.all([
        ...toAssign.map((roleId) =>
          userApi.assignRole(editingUser.id, { roleId, scopeType: 'GLOBAL', scopeId: 'GLOBAL' })
        ),
        ...toRevoke.map((roleId) => userApi.revokeRole(editingUser.id, roleId)),
      ])
      await fetchData()
      setEditingUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (user: UserResponse) => {
    try {
      if (user.active) await userApi.deactivate(user.id)
      else await userApi.activate(user.id)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status')
    }
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    setDeleting(true)
    try {
      await userApi.delete(deletingUser.id)
      await fetchData()
      setDeletingUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('Please enter an email address.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail.trim())) {
      setInviteError('Please enter a valid email address.')
      return
    }
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)
    try {
      const newUser = await userApi.invite({ email: inviteEmail.trim().toLowerCase() })
      setUsers((prev) => [newUser, ...prev])
      setInviteSuccess(
        `Invitation sent! Account created for ${newUser.firstName} ${newUser.lastName}.`
      )
      setInviteEmail('')
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation.')
    } finally {
      setInviting(false)
    }
  }

  const handleBulkInvite = async () => {
    if (!bulkFile) return
    setBulkLoading(true)
    setBulkError(null)
    setBulkResult(null)
    try {
      const result = await userApi.bulkInvite(bulkFile)
      setBulkResult(result)
      if (result.succeeded > 0) {
        const updatedUsers = await userApi.getAll()
        setUsers(updatedUsers)
      }
    } catch (err: unknown) {
      setBulkError(err instanceof Error ? err.message : 'Failed to process the file.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleContact = (user: UserResponse) => {
    window.location.href = `mailto:${user.email}`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                setInviteOpen(true)
                setInviteError(null)
                setInviteSuccess(null)
                setInviteEmail('')
              }}
            >
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-border bg-background rounded-md border px-3 py-2 text-sm dark:bg-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive (Blocked)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="dark:border-slate-700">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Showing {filteredUsers.length} of {users.length} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-border overflow-x-auto rounded-lg border dark:border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-700">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Roles</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const isInactive = !user.active
                    return (
                      <TableRow
                        key={user.id}
                        onClick={() => setViewingUser(user)}
                        className={`cursor-pointer transition-colors dark:border-slate-700 ${
                          isInactive
                            ? 'bg-red-50/60 hover:bg-red-100/60 dark:bg-red-950/20 dark:hover:bg-red-950/30'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {/* Avatar + Name */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} />
                            <div>
                              <p
                                className={`leading-tight font-medium ${
                                  isInactive ? 'text-red-700 dark:text-red-400' : 'text-foreground'
                                }`}
                              >
                                {user.firstName} {user.lastName}
                              </p>
                              {isInactive && (
                                <span className="text-xs font-medium text-red-500 dark:text-red-400">
                                  Blocked
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell
                          className={`text-sm ${
                            isInactive
                              ? 'text-red-600/80 dark:text-red-400/80'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {user.email}
                        </TableCell>

                        {/* Roles */}
                        <TableCell>
                          {user.roles.length === 0 ? (
                            <Badge variant="outline" className="gap-1 text-xs">
                              No Role
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((roleName) => (
                                <Badge
                                  key={roleName}
                                  variant={getRoleBadgeVariant([roleName])}
                                  className="gap-1 text-xs"
                                >
                                  <Shield className="h-2.5 w-2.5" />
                                  {roleName}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>

                        {/* Joined date */}
                        <TableCell
                          className={`text-sm ${
                            isInactive
                              ? 'text-red-600/70 dark:text-red-400/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatDate(user.createdAt)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <ActionDropdown
                            user={user}
                            onView={() => router.push(`/profile/${user.id}`)}
                            onEdit={() => openEdit(user)}
                            onContact={() => handleContact(user)}
                            onToggleActive={() => handleToggleActive(user)}
                            onDelete={() => setDeletingUser(user)}
                            canManage={canManageUsers}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open)
          if (!open) {
            setInviteEmail('')
            setInviteError(null)
            setInviteSuccess(null)
            setInviteTab('single')
            setBulkFile(null)
            setBulkResult(null)
            setBulkError(null)
          }
        }}
      >
        <DialogContent className="max-w-lg dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite User{inviteTab === 'bulk' ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Send email invitations to new users. They will receive login credentials
              automatically.
            </DialogDescription>
          </DialogHeader>

          {/* Tab switcher — only shown if user can bulk invite */}
          {canBulkInvite && (
            <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
              <button
                onClick={() => {
                  setInviteTab('single')
                  setBulkFile(null)
                  setBulkResult(null)
                  setBulkError(null)
                }}
                className={`flex-1 rounded py-1.5 text-sm font-medium transition-colors ${
                  inviteTab === 'single'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                Single Invite
              </button>
              <button
                onClick={() => {
                  setInviteTab('bulk')
                  setInviteSuccess(null)
                  setInviteError(null)
                  setInviteEmail('')
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-sm font-medium transition-colors ${
                  inviteTab === 'bulk'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Bulk via Excel
              </button>
            </div>
          )}

          {/* -- Single Invite Tab -- */}
          {inviteTab === 'single' && (
            <>
              {inviteSuccess ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                    <SendHorizonal className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{inviteSuccess}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInviteSuccess(null)
                        setInviteEmail('')
                      }}
                    >
                      Invite Another
                    </Button>
                    <Button onClick={() => setInviteOpen(false)}>Done</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      className="mt-1"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value)
                        setInviteError(null)
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && !inviting && handleInvite()}
                      disabled={inviting}
                      autoFocus
                    />
                    <p className="text-muted-foreground mt-1 text-xs">
                      The user's name will be derived from their email. They will receive a
                      temporary password and be asked to change it on first login.
                    </p>
                  </div>
                  {inviteError && (
                    <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                      {inviteError}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setInviteOpen(false)}
                      disabled={inviting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleInvite}
                      disabled={inviting || !inviteEmail.trim()}
                      className="gap-2"
                    >
                      {inviting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SendHorizonal className="h-4 w-4" />
                      )}
                      Send Invitation
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* -- Bulk Invite Tab -- */}
          {inviteTab === 'bulk' && (
            <div className="space-y-4">
              {!bulkResult ? (
                <>
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      const dropped = e.dataTransfer.files[0]
                      if (
                        dropped &&
                        (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls'))
                      ) {
                        setBulkFile(dropped)
                        setBulkError(null)
                      } else {
                        setBulkError('Please upload a valid .xlsx or .xls file.')
                      }
                    }}
                    className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
                      dragOver
                        ? 'border-primary bg-primary/5'
                        : bulkFile
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                          : 'border-slate-300 hover:border-slate-400 dark:border-slate-600'
                    }`}
                    onClick={() => document.getElementById('bulk-file-input')?.click()}
                  >
                    <input
                      id="bulk-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          setBulkFile(f)
                          setBulkError(null)
                        }
                      }}
                    />
                    {bulkFile ? (
                      <>
                        <FileSpreadsheet className="h-10 w-10 text-green-500" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            {bulkFile.name}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {(bulkFile.size / 1024).toFixed(1)} KB — click to change
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-10 w-10 text-slate-400" />
                        <div className="text-center">
                          <p className="text-sm font-medium">Drop your Excel file here</p>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            or click to browse — .xlsx or .xls
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                    💡 Your file must have a column whose header contains the word{' '}
                    <strong>email</strong>. All other columns are ignored.
                  </div>

                  {bulkError && (
                    <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                      {bulkError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setInviteOpen(false)}
                      disabled={bulkLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkInvite}
                      disabled={!bulkFile || bulkLoading}
                      className="gap-2"
                    >
                      {bulkLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SendHorizonal className="h-4 w-4" />
                      )}
                      {bulkLoading ? 'Sending...' : 'Send Invitations'}
                    </Button>
                  </div>
                </>
              ) : (
                /* Results view */
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                      <p className="text-xl font-bold text-green-700 dark:text-green-400">
                        {bulkResult.succeeded}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500">Invited</p>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                      <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                        {bulkResult.skipped}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-500">Skipped</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                      <p className="text-xl font-bold text-red-700 dark:text-red-400">
                        {bulkResult.failed}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500">Failed</p>
                    </div>
                  </div>

                  {/* Row details */}
                  <div className="max-h-56 overflow-y-auto rounded-md border dark:border-slate-700">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-slate-500">#</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-500">Email</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-500">Status</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-500">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-slate-700">
                        {bulkResult.rows.map((row) => (
                          <tr
                            key={row.rowNumber}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="px-3 py-2 text-slate-400">{row.rowNumber}</td>
                            <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                              {row.email}
                            </td>
                            <td className="px-3 py-2">
                              {row.status === 'SUCCESS' && (
                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Invited
                                </span>
                              )}
                              {row.status === 'SKIPPED' && (
                                <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                  <MinusCircle className="h-3.5 w-3.5" /> Skipped
                                </span>
                              )}
                              {row.status === 'FAILED' && (
                                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                                  <AlertCircle className="h-3.5 w-3.5" /> Failed
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-500">{row.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBulkResult(null)
                        setBulkFile(null)
                      }}
                    >
                      Upload Another
                    </Button>
                    <Button onClick={() => setInviteOpen(false)}>Done</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto dark:border-slate-700">
          <DialogHeader className="bg-background sticky top-0 z-10">
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and roles</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 pb-4">
              {/* User identity preview */}
              <div className="bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2">
                <UserAvatar user={editingUser} size="md" />
                <div>
                  <p className="font-medium">
                    {editingUser.firstName} {editingUser.lastName}
                  </p>
                  <p className="text-muted-foreground text-xs">{editingUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    className="mt-1"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    className="mt-1"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Job Title</label>
                <Input
                  className="mt-1"
                  value={editForm.jobTitle}
                  onChange={(e) => setEditForm((f) => ({ ...f, jobTitle: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-slate-900"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                />
              </div>

              {/* Roles — CEO only */}
              {canEditRoles && (
                <div>
                  <label className="text-sm font-medium">Roles</label>
                  <p className="text-muted-foreground mb-2 text-xs">
                    Select one or more roles for this user
                  </p>
                  <div className="border-border grid grid-cols-2 gap-2 rounded-md border p-3 dark:border-slate-700">
                    {roles.map((role) => (
                      <label
                        key={role.id}
                        className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={assignedRoleIds.has(role.id)}
                          onChange={() => toggleRole(role.id)}
                          className="accent-primary h-4 w-4"
                        />
                        <span className="text-sm">{role.name}</span>
                      </label>
                    ))}
                  </div>
                  {assignedRoleIds.size > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[...assignedRoleIds].map((id) => {
                        const role = roles.find((r) => r.id === id)
                        if (!role) return null
                        return (
                          <Badge key={id} variant="secondary" className="gap-1 pr-1">
                            {role.name}
                            <button
                              onClick={() => toggleRole(id)}
                              className="hover:text-destructive ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent className="dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {deletingUser?.firstName} {deletingUser?.lastName}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Detail Modal */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent className="max-w-lg dark:border-slate-700">
          {viewingUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Profile</DialogTitle>
                <DialogDescription>View detailed information about this user</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* User Header */}
                <div className="bg-muted/50 flex items-center gap-4 rounded-lg p-4">
                  <UserAvatar user={viewingUser} size="md" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {viewingUser.firstName} {viewingUser.lastName}
                    </h3>
                    <p className="text-muted-foreground text-sm">{viewingUser.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          viewingUser.active ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-xs font-medium">
                        {viewingUser.active ? 'Active' : 'Inactive (Blocked)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-muted-foreground text-xs font-semibold uppercase">
                      Job Title
                    </label>
                    <p className="mt-1 text-sm font-medium">{viewingUser.jobTitle || '—'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs font-semibold uppercase">
                      Phone
                    </label>
                    <p className="mt-1 text-sm font-medium">
                      {viewingUser.phoneNumber ? (
                        <a href={`tel:${viewingUser.phoneNumber}`} className="hover:underline">
                          {viewingUser.phoneNumber}
                        </a>
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs font-semibold uppercase">
                      Birth Date
                    </label>
                    <p className="mt-1 text-sm font-medium">{formatDate(viewingUser.birthDate)}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs font-semibold uppercase">
                      Joined
                    </label>
                    <p className="mt-1 text-sm font-medium">{formatDate(viewingUser.createdAt)}</p>
                  </div>
                </div>

                {/* Bio */}
                {viewingUser.bio && (
                  <div>
                    <label className="text-muted-foreground text-xs font-semibold uppercase">
                      Bio
                    </label>
                    <p className="text-foreground mt-2 text-sm leading-relaxed">
                      {viewingUser.bio}
                    </p>
                  </div>
                )}

                {/* Roles */}
                <div>
                  <label className="text-muted-foreground text-xs font-semibold uppercase">
                    Roles
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {viewingUser.roles.length === 0 ? (
                      <span className="text-muted-foreground text-sm">No roles assigned</span>
                    ) : (
                      viewingUser.roles.map((roleName) => (
                        <Badge
                          key={roleName}
                          variant={getRoleBadgeVariant([roleName])}
                          className="gap-1"
                        >
                          <Shield className="h-3 w-3" />
                          {roleName}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Last Login */}
                <div className="border-muted border-t pt-4">
                  <label className="text-muted-foreground text-xs font-semibold uppercase">
                    Last Login
                  </label>
                  <p className="mt-1 text-sm font-medium">
                    {viewingUser.lastLogin ? formatDate(viewingUser.lastLogin) : 'Never logged in'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setViewingUser(null)
                      openEdit(viewingUser)
                    }}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setViewingUser(null)
                      handleContact(viewingUser)
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Contact
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/profile/${viewingUser.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Profile
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
