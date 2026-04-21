'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Building2,
  Users,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  Globe,
  Lock,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Crown,
  UserCog,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import {
  departmentApi,
  teamApi,
  userApi,
  DepartmentResponse,
  TeamResponse,
  UserResponse,
  DepartmentRequest,
  TeamRequest,
  VisibilityType,
} from '@/lib/api'
import { tokenStorage } from '@/lib/api'

// --- Small helpers -------------------------------------------------------------

function UserAvatar({
  user,
  size = 'sm',
}: {
  user: { firstName: string; lastName: string; avatar?: string | null }
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
  if (user.avatar) {
    return <img src={user.avatar} alt="" className={`${dim} rounded-full object-cover`} />
  }
  return (
    <div
      className={`${dim} bg-primary/10 text-primary flex items-center justify-center rounded-full font-semibold`}
    >
      {user.firstName[0]}
      {user.lastName[0]}
    </div>
  )
}

// --- Department Form ----------------------------------------------------------

interface DeptFormProps {
  initial?: DepartmentResponse | null
  users: UserResponse[]
  onSave: (data: DepartmentRequest) => Promise<void>
  onCancel: () => void
  loading: boolean
}

function DepartmentForm({ initial, users, onSave, onCancel, loading }: DeptFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [managerId, setManagerId] = useState(initial?.managerId ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSave({ name, description, managerId: managerId || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
      <div>
        <label className="text-foreground text-sm font-medium">Name *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1"
          placeholder="e.g. Engineering"
        />
      </div>
      <div>
        <label className="text-foreground text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          placeholder="What does this department do?"
        />
      </div>
      <div>
        <label className="text-foreground text-sm font-medium">Manager (optional)</label>
        <select
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
          className="border-input bg-background focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <option value="">— None —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName} ({u.email})
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? 'Save changes' : 'Create department'}
        </Button>
      </div>
    </form>
  )
}

// --- Team Form ----------------------------------------------------------------

interface TeamFormProps {
  initial?: TeamResponse | null
  departments: DepartmentResponse[]
  users: UserResponse[]
  onSave: (data: TeamRequest) => Promise<void>
  onCancel: () => void
  loading: boolean
  defaultDeptId?: string
}

function TeamForm({
  initial,
  departments,
  users,
  onSave,
  onCancel,
  loading,
  defaultDeptId,
}: TeamFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [departmentId, setDepartmentId] = useState(initial?.departmentId ?? defaultDeptId ?? '')
  const [leadId, setLeadId] = useState(initial?.leadId ?? '')
  const [image, setImage] = useState(initial?.avatarUrl ?? '')
  const [visibility, setVisibility] = useState<VisibilityType>(initial?.teamVisibility ?? 'PUBLIC')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSave({
      name,
      description,
      departmentId,
      leadId: leadId || undefined,
      avatarUrl: image || undefined,
      teamVisibility: visibility,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
      <div>
        <label className="text-foreground text-sm font-medium">Team Name *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1"
          placeholder="e.g. Frontend Engineers"
        />
      </div>
      <div>
        <label className="text-foreground text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          placeholder="What does this team work on?"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-foreground text-sm font-medium">Department *</label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
            className="border-input bg-background focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="">— Select —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-foreground text-sm font-medium">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as VisibilityType)}
            className="border-input bg-background focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-foreground text-sm font-medium">Team Lead (optional)</label>
        <select
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          className="border-input bg-background focus-visible:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <option value="">— None —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName} ({u.email})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-foreground text-sm font-medium">Team Avatar URL (optional)</label>
        <Input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="mt-1"
          placeholder="https://..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name.trim() || !departmentId}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? 'Save changes' : 'Create team'}
        </Button>
      </div>
    </form>
  )
}

// --- Main page ----------------------------------------------------------------

export default function AdminOrganizationsPage() {
  const router = useRouter()

  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Expanded dept rows
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())

  // Active tab
  const [tab, setTab] = useState<'departments' | 'teams'>('departments')

  // Dialogs
  const [deptDialog, setDeptDialog] = useState<{
    open: boolean
    editing: DepartmentResponse | null
  }>({ open: false, editing: null })
  const [teamDialog, setTeamDialog] = useState<{
    open: boolean
    editing: TeamResponse | null
    defaultDeptId?: string
  }>({ open: false, editing: null })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: 'dept' | 'team'
    id: string
    name: string
  } | null>(null)

  // -- Data loading ---------------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [depts, allTeams, allUsers] = await Promise.all([
        departmentApi.getAll(),
        teamApi.getAll(),
        userApi.getAll(),
      ])
      setDepartments(depts)
      setTeams(allTeams)
      setUsers(allUsers)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // -- Department actions ---------------------------------------------------

  async function handleSaveDept(data: DepartmentRequest) {
    setSaving(true)
    try {
      if (deptDialog.editing) {
        const updated = await departmentApi.update(deptDialog.editing.id, data)
        setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
      } else {
        const created = await departmentApi.create(data)
        setDepartments((prev) => [...prev, created])
      }
      setDeptDialog({ open: false, editing: null })
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteDept(id: string) {
    try {
      await departmentApi.delete(id)
      setDepartments((prev) => prev.filter((d) => d.id !== id))
      setTeams((prev) => prev.filter((t) => t.departmentId !== id))
    } catch (e: any) {
      alert(e.message)
    }
    setDeleteDialog(null)
  }

  async function handleToggleDeptActive(dept: DepartmentResponse) {
    try {
      const updated = dept.isActive
        ? await departmentApi.deactivate(dept.id)
        : await departmentApi.activate(dept.id)
      setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
    } catch (e: any) {
      alert(e.message)
    }
  }

  // -- Team actions ---------------------------------------------------------

  async function handleSaveTeam(data: TeamRequest) {
    setSaving(true)
    try {
      if (teamDialog.editing) {
        const updated = await teamApi.update(teamDialog.editing.id, data)
        setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      } else {
        const created = await teamApi.create(data)
        setTeams((prev) => [...prev, created])
      }
      setTeamDialog({ open: false, editing: null })
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTeam(id: string) {
    try {
      await teamApi.delete(id)
      setTeams((prev) => prev.filter((t) => t.id !== id))
    } catch (e: any) {
      alert(e.message)
    }
    setDeleteDialog(null)
  }

  // -- Derived --------------------------------------------------------------

  function teamsForDept(deptId: string) {
    return teams.filter((t) => t.departmentId === deptId)
  }

  function toggleDept(id: string) {
    setExpandedDepts((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // -- Render ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage departments and teams across your workspace
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{departments.length}</p>
                <p className="text-muted-foreground text-xs">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-500/10 p-2">
                <Users className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teams.length}</p>
                <p className="text-muted-foreground text-xs">Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{departments.filter((d) => d.isActive).length}</p>
                <p className="text-muted-foreground text-xs">Active Depts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-border flex gap-1 border-b">
        {(['departments', 'teams'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* -- Departments Tab ---------------------------------------------------- */}
      {tab === 'departments' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base">Departments</CardTitle>
              <CardDescription>{departments.length} total</CardDescription>
            </div>
            <Button size="sm" onClick={() => setDeptDialog({ open: true, editing: null })}>
              <Plus className="mr-2 h-4 w-4" /> New Department
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                      No departments yet. Create your first one.
                    </TableCell>
                  </TableRow>
                )}
                {departments.map((dept) => (
                  <>
                    <TableRow key={dept.id} className="hover:bg-muted/30">
                      <TableCell>
                        <button
                          onClick={() => toggleDept(dept.id)}
                          className="hover:bg-muted rounded p-1 transition-colors"
                        >
                          {expandedDepts.has(dept.id) ? (
                            <ChevronDown className="text-muted-foreground h-4 w-4" />
                          ) : (
                            <ChevronRight className="text-muted-foreground h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{dept.name}</p>
                          {dept.description && (
                            <p className="text-muted-foreground max-w-xs truncate text-xs">
                              {dept.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {dept.manager ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={dept.manager} />
                            <span className="text-sm">
                              {dept.manager.firstName} {dept.manager.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">No manager</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{dept.teamCount} teams</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={dept.isActive ? 'default' : 'secondary'}>
                          {dept.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDeptDialog({ open: true, editing: dept })}
                            >
                              <Edit2 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setTeamDialog({ open: true, editing: null, defaultDeptId: dept.id })
                              }
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add Team
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleDeptActive(dept)}>
                              {dept.isActive ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" /> Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  type: 'dept',
                                  id: dept.id,
                                  name: dept.name,
                                })
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Expanded: inline team list */}
                    {expandedDepts.has(dept.id) && (
                      <TableRow key={`${dept.id}-teams`} className="bg-muted/20 hover:bg-muted/20">
                        <TableCell />
                        <TableCell colSpan={5} className="py-3">
                          <div className="space-y-2 pl-2">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                Teams in {dept.name}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() =>
                                  setTeamDialog({
                                    open: true,
                                    editing: null,
                                    defaultDeptId: dept.id,
                                  })
                                }
                              >
                                <Plus className="mr-1 h-3 w-3" /> Add Team
                              </Button>
                            </div>
                            {teamsForDept(dept.id).length === 0 ? (
                              <p className="text-muted-foreground text-xs italic">No teams yet</p>
                            ) : (
                              teamsForDept(dept.id).map((team) => (
                                <div
                                  key={team.id}
                                  className="border-border bg-background flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                  <div className="flex items-center gap-3">
                                    {team.avatarUrl ? (
                                      <img
                                        src={team.avatarUrl}
                                        alt=""
                                        className="h-7 w-7 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10">
                                        <Users className="h-3.5 w-3.5 text-violet-500" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-sm font-medium">{team.name}</p>
                                      <p className="text-muted-foreground text-xs">
                                        {team.memberCount} members
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {team.lead && (
                                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                        <Crown className="h-3 w-3" />
                                        {team.lead.firstName} {team.lead.lastName}
                                      </div>
                                    )}
                                    <Badge
                                      variant={
                                        team.teamVisibility === 'PUBLIC' ? 'secondary' : 'outline'
                                      }
                                      className="text-xs"
                                    >
                                      {team.teamVisibility === 'PUBLIC' ? (
                                        <Globe className="mr-1 h-3 w-3" />
                                      ) : (
                                        <Lock className="mr-1 h-3 w-3" />
                                      )}
                                      {team.teamVisibility}
                                    </Badge>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => setTeamDialog({ open: true, editing: team })}
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-destructive hover:text-destructive h-7 w-7"
                                      onClick={() =>
                                        setDeleteDialog({
                                          open: true,
                                          type: 'team',
                                          id: team.id,
                                          name: team.name,
                                        })
                                      }
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* -- Teams Tab ---------------------------------------------------------- */}
      {tab === 'teams' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base">All Teams</CardTitle>
              <CardDescription>{teams.length} total across all departments</CardDescription>
            </div>
            <Button size="sm" onClick={() => setTeamDialog({ open: true, editing: null })}>
              <Plus className="mr-2 h-4 w-4" /> New Team
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                      No teams yet. Create departments first, then add teams.
                    </TableCell>
                  </TableRow>
                )}
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {team.avatarUrl ? (
                          <img
                            src={team.avatarUrl}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
                            <Users className="h-4 w-4 text-violet-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{team.name}</p>
                          {team.description && (
                            <p className="text-muted-foreground max-w-xs truncate text-xs">
                              {team.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{team.departmentName ?? team.departmentId}</Badge>
                    </TableCell>
                    <TableCell>
                      {team.lead ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar user={team.lead} />
                          <span className="text-sm">
                            {team.lead.firstName} {team.lead.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">No lead</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{team.memberCount}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.teamVisibility === 'PUBLIC' ? 'secondary' : 'outline'}>
                        {team.teamVisibility === 'PUBLIC' ? (
                          <>
                            <Globe className="mr-1 h-3 w-3" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="mr-1 h-3 w-3" />
                            Private
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setTeamDialog({ open: true, editing: team })}
                          >
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: 'team',
                                id: team.id,
                                name: team.name,
                              })
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* -- Department Dialog ------------------------------------------------- */}
      <Dialog
        open={deptDialog.open}
        onOpenChange={(open) => !open && setDeptDialog({ open: false, editing: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{deptDialog.editing ? 'Edit Department' : 'New Department'}</DialogTitle>
            <DialogDescription>
              {deptDialog.editing
                ? 'Update department details'
                : 'Create a new department and optionally assign a manager.'}
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm
            initial={deptDialog.editing}
            users={users}
            onSave={handleSaveDept}
            onCancel={() => setDeptDialog({ open: false, editing: null })}
            loading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* -- Team Dialog ------------------------------------------------------- */}
      <Dialog
        open={teamDialog.open}
        onOpenChange={(open) => !open && setTeamDialog({ open: false, editing: null })}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{teamDialog.editing ? 'Edit Team' : 'New Team'}</DialogTitle>
            <DialogDescription>
              {teamDialog.editing ? 'Update team details' : 'Create a new team under a department.'}
            </DialogDescription>
          </DialogHeader>
          <TeamForm
            initial={teamDialog.editing}
            departments={departments}
            users={users}
            onSave={handleSaveTeam}
            onCancel={() => setTeamDialog({ open: false, editing: null })}
            loading={saving}
            defaultDeptId={teamDialog.defaultDeptId}
          />
        </DialogContent>
      </Dialog>

      {/* -- Delete Confirm ---------------------------------------------------- */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialog?.type === 'dept' ? 'Department' : 'Team'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteDialog?.name}</strong>?
              {deleteDialog?.type === 'dept' && ' This will also remove all teams within it.'} This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteDialog) return
                deleteDialog.type === 'dept'
                  ? handleDeleteDept(deleteDialog.id)
                  : handleDeleteTeam(deleteDialog.id)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
