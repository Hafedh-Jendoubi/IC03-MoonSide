'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit2, Trash2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

// Mock roles and permissions data
const mockRoles = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access and management capabilities',
    userCount: 2,
    permissions: [
      { id: 'users.read', name: 'Read Users', resource: 'users', action: 'read' },
      { id: 'users.write', name: 'Create/Edit Users', resource: 'users', action: 'write' },
      { id: 'users.delete', name: 'Delete Users', resource: 'users', action: 'delete' },
      { id: 'roles.read', name: 'Read Roles', resource: 'roles', action: 'read' },
      { id: 'roles.write', name: 'Manage Roles', resource: 'roles', action: 'write' },
      { id: 'posts.delete', name: 'Delete Posts', resource: 'posts', action: 'delete' },
      { id: 'settings.write', name: 'System Settings', resource: 'settings', action: 'write' },
    ],
  },
  {
    id: 'moderator',
    name: 'Moderator',
    description: 'Content moderation and user management',
    userCount: 3,
    permissions: [
      { id: 'users.read', name: 'Read Users', resource: 'users', action: 'read' },
      { id: 'posts.read', name: 'Read Posts', resource: 'posts', action: 'read' },
      { id: 'posts.delete', name: 'Delete Posts', resource: 'posts', action: 'delete' },
      { id: 'comments.delete', name: 'Delete Comments', resource: 'comments', action: 'delete' },
    ],
  },
  {
    id: 'user',
    name: 'User',
    description: 'Regular user with basic permissions',
    userCount: 615,
    permissions: [
      { id: 'posts.read', name: 'Read Posts', resource: 'posts', action: 'read' },
      { id: 'posts.write', name: 'Create Posts', resource: 'posts', action: 'write' },
      { id: 'comments.write', name: 'Comment', resource: 'comments', action: 'write' },
      { id: 'profile.write', name: 'Edit Profile', resource: 'profile', action: 'write' },
    ],
  },
]

const allAvailablePermissions = [
  { id: 'users.read', name: 'Read Users', resource: 'users', action: 'read' },
  { id: 'users.write', name: 'Create/Edit Users', resource: 'users', action: 'write' },
  { id: 'users.delete', name: 'Delete Users', resource: 'users', action: 'delete' },
  { id: 'roles.read', name: 'Read Roles', resource: 'roles', action: 'read' },
  { id: 'roles.write', name: 'Manage Roles', resource: 'roles', action: 'write' },
  { id: 'posts.read', name: 'Read Posts', resource: 'posts', action: 'read' },
  { id: 'posts.write', name: 'Create Posts', resource: 'posts', action: 'write' },
  { id: 'posts.delete', name: 'Delete Posts', resource: 'posts', action: 'delete' },
  { id: 'comments.read', name: 'Read Comments', resource: 'comments', action: 'read' },
  { id: 'comments.write', name: 'Create Comments', resource: 'comments', action: 'write' },
  { id: 'comments.delete', name: 'Delete Comments', resource: 'comments', action: 'delete' },
  { id: 'profile.read', name: 'View Profiles', resource: 'profile', action: 'read' },
  { id: 'profile.write', name: 'Edit Profile', resource: 'profile', action: 'write' },
  { id: 'settings.read', name: 'View Settings', resource: 'settings', action: 'read' },
  { id: 'settings.write', name: 'System Settings', resource: 'settings', action: 'write' },
]

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const currentRole = selectedRole ? mockRoles.find((r) => r.id === selectedRole) : null

  const groupPermissionsByResource = (permissions: typeof allAvailablePermissions) => {
    return permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = []
        }
        acc[perm.resource].push(perm)
        return acc
      },
      {} as Record<string, typeof allAvailablePermissions>
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl dark:border-slate-700">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Define a new role with specific permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Role Name</label>
                <Input placeholder="e.g., Content Editor" className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="Describe the purpose of this role..."
                  className="border-border bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm dark:bg-slate-900"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium">Permissions</label>
                <div className="border-border bg-muted/30 max-h-64 space-y-4 overflow-y-auto rounded-lg border p-4 dark:border-slate-700">
                  {Object.entries(groupPermissionsByResource(allAvailablePermissions)).map(
                    ([resource, perms]) => (
                      <div key={resource} className="space-y-2">
                        <h4 className="text-sm font-semibold capitalize">{resource}</h4>
                        <div className="space-y-2 pl-4">
                          {perms.map((perm) => (
                            <div key={perm.id} className="flex items-center gap-2">
                              <Checkbox id={perm.id} />
                              <label htmlFor={perm.id} className="cursor-pointer text-sm">
                                {perm.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsOpen(false)}>Create Role</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <Card className="dark:border-slate-700">
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>{mockRoles.length} roles defined</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-colors dark:border-slate-700 ${
                    selectedRole === role.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <p className="font-medium">{role.name}</p>
                  <p className="text-muted-foreground text-xs">{role.userCount} users</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Role Details */}
        <div className="lg:col-span-2">
          {currentRole ? (
            <Card className="dark:border-slate-700">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-2">
                  <CardTitle>{currentRole.name}</CardTitle>
                  <CardDescription>{currentRole.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1">
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive gap-1"
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
                    <p className="text-muted-foreground text-xs">Users with this role</p>
                    <p className="text-2xl font-bold">{currentRole.userCount}</p>
                  </div>
                  <div className="border-border bg-muted/30 rounded-lg border p-4 dark:border-slate-700">
                    <p className="text-muted-foreground text-xs">Permissions</p>
                    <p className="text-2xl font-bold">{currentRole.permissions.length}</p>
                  </div>
                </div>

                {/* Permissions by Resource */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Permissions</h3>
                  <div className="space-y-3">
                    {Object.entries(groupPermissionsByResource(currentRole.permissions)).map(
                      ([resource, perms]) => (
                        <div key={resource} className="space-y-2">
                          <h4 className="text-muted-foreground text-sm font-medium capitalize">
                            {resource}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {perms.map((perm) => (
                              <Badge key={perm.id} variant="secondary">
                                {perm.action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
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
    </div>
  )
}
