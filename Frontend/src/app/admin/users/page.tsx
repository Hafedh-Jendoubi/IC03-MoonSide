'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Edit2,
  Trash2,
  Shield,
  User,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX,
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
import { userApi, roleApi, UserResponse, RoleResponse } from '@/lib/api'

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Edit user state
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', jobTitle: '', bio: '' })
  const [assignRoleId, setAssignRoleId] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete user state
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

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
        (filterStatus === 'active' && user.isActive) ||
        (filterStatus === 'inactive' && !user.isActive)
      return matchesSearch && matchesStatus
    })
  }, [users, searchQuery, filterStatus])

  const getRoleNameById = (roleId: string | null) => {
    if (!roleId) return 'No Role'
    const role = roles.find((r) => r.id === roleId)
    return role ? role.name : 'Unknown'
  }

  const getRoleBadgeVariant = (
    roleId: string | null
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!roleId) return 'outline'
    const roleName = getRoleNameById(roleId).toLowerCase()
    if (roleName === 'admin') return 'default'
    if (roleName === 'moderator') return 'secondary'
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
    setAssignRoleId(user.roleId ?? '')
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
      if (assignRoleId && assignRoleId !== editingUser.roleId) {
        await userApi.assignRole(editingUser.id, { roleId: assignRoleId })
      }
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
      if (user.isActive) {
        await userApi.deactivate(user.id)
      } else {
        await userApi.activate(user.id)
      }
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString()
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
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
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
            <option value="inactive">Inactive</option>
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
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50 dark:border-slate-700">
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.roleId)} className="gap-1">
                          {user.roleId ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          {getRoleNameById(user.roleId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEdit(user)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleToggleActive(user)}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? (
                              <UserX className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-500" />
                            )}
                            <span className="sr-only">
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            onClick={() => setDeletingUser(user)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="dark:border-slate-700">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <div>
              <label className="text-sm font-medium">Assign Role</label>
              <select
                className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-slate-900"
                value={assignRoleId}
                onChange={(e) => setAssignRoleId(e.target.value)}
              >
                <option value="">No Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
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
    </div>
  )
}
