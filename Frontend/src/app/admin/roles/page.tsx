'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit2, Trash2, Plus, Loader2, RefreshCw } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { roleApi, permissionApi, RoleResponse, PermissionResponse } from '@/lib/api'

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [allPermissions, setAllPermissions] = useState<PermissionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  // Create / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPermissions, setFormPermissions] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deletingRole, setDeletingRole] = useState<RoleResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rolesData, permsData] = await Promise.all([roleApi.getAll(), permissionApi.getAll()])
      setRoles(rolesData)
      setAllPermissions(permsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const selectedRole = selectedRoleId ? roles.find((r) => r.id === selectedRoleId) : null

  const groupPermissionsByScopeType = (permissions: PermissionResponse[]) => {
    return permissions.reduce(
      (acc, perm) => {
        const key = perm.scopeType ?? 'OTHER'
        if (!acc[key]) acc[key] = []
        acc[key].push(perm)
        return acc
      },
      {} as Record<string, PermissionResponse[]>
    )
  }

  const openCreate = () => {
    setEditingRole(null)
    setFormName('')
    setFormDescription('')
    setFormPermissions(new Set())
    setDialogOpen(true)
  }

  const openEdit = (role: RoleResponse) => {
    setEditingRole(role)
    setFormName(role.name)
    setFormDescription(role.description ?? '')
    setFormPermissions(new Set(role.permissions.map((p) => p.id)))
    setDialogOpen(true)
  }

  const togglePermission = (permId: string) => {
    setFormPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(permId)) next.delete(permId)
      else next.add(permId)
      return next
    })
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    setSaving(true)
    try {
      if (editingRole) {
        // Update role info
        const updated = await roleApi.update(editingRole.id, {
          name: formName,
          description: formDescription || undefined,
        })

        // Sync permissions: revoke removed, assign added
        const currentPermIds = new Set(editingRole.permissions.map((p) => p.id))
        const toRevoke = [...currentPermIds].filter((id) => !formPermissions.has(id))
        const toAssign = [...formPermissions].filter((id) => !currentPermIds.has(id))

        await Promise.all([
          ...toRevoke.map((pid) => roleApi.revokePermission(updated.id, pid)),
          ...toAssign.map((pid) => roleApi.assignPermission(updated.id, pid)),
        ])
      } else {
        // Create role then assign permissions
        const created = await roleApi.create({
          name: formName,
          description: formDescription || undefined,
        })
        await Promise.all(
          [...formPermissions].map((pid) => roleApi.assignPermission(created.id, pid))
        )
        setSelectedRoleId(created.id)
      }
      await fetchData()
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingRole) return
    setDeleting(true)
    try {
      await roleApi.delete(deletingRole.id)
      if (selectedRoleId === deletingRole.id) setSelectedRoleId(null)
      await fetchData()
      setDeletingRole(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role')
    } finally {
      setDeleting(false)
    }
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
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage system roles and their permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Role
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <Card className="dark:border-slate-700">
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>{roles.length} roles defined</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {roles.length === 0 ? (
                <p className="text-muted-foreground text-sm">No roles yet. Create one!</p>
              ) : (
                roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors dark:border-slate-700 ${
                      selectedRoleId === role.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <p className="font-medium">{role.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {role.permissions.length} permissions
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Role Details */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card className="dark:border-slate-700">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-2">
                  <CardTitle>{selectedRole.name}</CardTitle>
                  <CardDescription>{selectedRole.description ?? 'No description'}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => openEdit(selectedRole)}
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive gap-1"
                    onClick={() => setDeletingRole(selectedRole)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Role Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-border bg-muted/30 rounded-lg border p-4 dark:border-slate-700">
                    <p className="text-muted-foreground text-xs">Created At</p>
                    <p className="font-semibold">
                      {new Date(selectedRole.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="border-border bg-muted/30 rounded-lg border p-4 dark:border-slate-700">
                    <p className="text-muted-foreground text-xs">Permissions</p>
                    <p className="text-2xl font-bold">{selectedRole.permissions.length}</p>
                  </div>
                </div>

                {/* Permissions by Scope */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Permissions</h3>
                  {selectedRole.permissions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No permissions assigned.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(groupPermissionsByScopeType(selectedRole.permissions)).map(
                        ([scope, perms]) => (
                          <div key={scope} className="space-y-2">
                            <h4 className="text-muted-foreground text-sm font-medium capitalize">
                              {scope}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {perms.map((perm) => (
                                <Badge
                                  key={perm.id}
                                  variant="secondary"
                                  title={perm.description ?? ''}
                                >
                                  {perm.action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex min-h-96 items-center justify-center dark:border-slate-700">
              <CardContent className="text-center">
                <p className="text-muted-foreground">Select a role to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create / Edit Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="max-w-2xl dark:border-slate-700">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Update role details and permissions'
                : 'Define a new role with specific permissions'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Role Name</label>
              <Input
                placeholder="e.g., Content Editor"
                className="mt-2"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Describe the purpose of this role..."
                className="border-border bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm dark:bg-slate-900"
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-3 block text-sm font-medium">
                Permissions
                {allPermissions.length === 0 && (
                  <span className="text-muted-foreground ml-2 font-normal">(none available)</span>
                )}
              </label>
              {allPermissions.length > 0 && (
                <div className="border-border bg-muted/30 max-h-64 space-y-4 overflow-y-auto rounded-lg border p-4 dark:border-slate-700">
                  {Object.entries(groupPermissionsByScopeType(allPermissions)).map(
                    ([scope, perms]) => (
                      <div key={scope} className="space-y-2">
                        <h4 className="text-sm font-semibold capitalize">{scope}</h4>
                        <div className="space-y-2 pl-4">
                          {perms.map((perm) => (
                            <div key={perm.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`perm-${perm.id}`}
                                checked={formPermissions.has(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                              />
                              <label
                                htmlFor={`perm-${perm.id}`}
                                className="cursor-pointer text-sm"
                                title={perm.description ?? ''}
                              >
                                {perm.action}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !formName.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRole ? 'Save Changes' : 'Create Role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <AlertDialogContent className="dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role <strong>{deletingRole?.name}</strong>? This
              action cannot be undone.
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
