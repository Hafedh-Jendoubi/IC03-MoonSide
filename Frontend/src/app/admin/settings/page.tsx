'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Save, AlertCircle, Loader2, Users, Shield, Key } from 'lucide-react'
import {
  userApi,
  roleApi,
  permissionApi,
  UserResponse,
  RoleResponse,
  PermissionResponse,
} from '@/lib/api'

const SETTINGS_KEY = 'worksphere_admin_settings'

const defaultSettings = {
  siteName: 'WorkSphere',
  siteDescription: 'Internal employee collaboration platform',
  maxUploadSize: 10,
  enableNotifications: true,
  enableEmailNotifications: true,
  maintenanceMode: false,
  autoBackup: true,
  backupFrequency: 'daily',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Live system stats from API
  const [users, setUsers] = useState<UserResponse[]>([])
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [permissions, setPermissions] = useState<PermissionResponse[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  // Persist settings to localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) setSettings(JSON.parse(stored))
    } catch {
      // ignore
    }
  }, [])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const [u, r, p] = await Promise.all([
        userApi.getAll(),
        roleApi.getAll(),
        permissionApi.getAll(),
      ])
      setUsers(u)
      setRoles(r)
      setPermissions(p)
    } catch {
      // silently fail — stats are supplementary
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      await new Promise((r) => setTimeout(r, 300))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const activeUsers = users.filter((u) => u.isActive)
  const totalPermissions = permissions.length

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage system configuration and preferences</p>
      </div>

      {/* Live System Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-muted-foreground text-xs">{activeUsers.length} active</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{roles.length}</div>
                <p className="text-muted-foreground text-xs">
                  {roles.map((r) => r.name).join(', ') || 'None defined'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Key className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalPermissions}</div>
                <p className="text-muted-foreground text-xs">Across all roles</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* General Settings */}
      <Card className="dark:border-slate-700">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic system configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Site Name</label>
            <Input
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              placeholder="Site name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Site Description</label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              placeholder="Brief description of your site"
              className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm dark:bg-slate-900"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Upload Size (MB)</label>
            <Input
              type="number"
              value={settings.maxUploadSize}
              onChange={(e) =>
                setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) || 10 })
              }
              placeholder="Max file size"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="dark:border-slate-700">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure how notifications are sent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-border bg-muted/30 flex items-center justify-between rounded-lg border p-4 dark:border-slate-700">
            <div>
              <p className="font-medium">Enable Notifications</p>
              <p className="text-muted-foreground text-sm">Send in-app notifications to users</p>
            </div>
            <Switch
              checked={settings.enableNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableNotifications: checked })
              }
            />
          </div>
          <div className="border-border bg-muted/30 flex items-center justify-between rounded-lg border p-4 dark:border-slate-700">
            <div>
              <p className="font-medium">Enable Email Notifications</p>
              <p className="text-muted-foreground text-sm">Send email notifications to users</p>
            </div>
            <Switch
              checked={settings.enableEmailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableEmailNotifications: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card className="border-destructive/30 bg-destructive/5 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="text-destructive h-5 w-5" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>Take the site offline for maintenance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-border flex items-center justify-between rounded-lg border p-4 dark:border-slate-700">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-muted-foreground text-sm">Users will see a maintenance page</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>
          {settings.maintenanceMode && (
            <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4">
              <p className="text-sm font-medium">Site is in maintenance mode</p>
              <p className="text-muted-foreground mt-1 text-xs">Only admins can access the site</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card className="dark:border-slate-700">
        <CardHeader>
          <CardTitle>Backup Settings</CardTitle>
          <CardDescription>Configure automatic backups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-border bg-muted/30 flex items-center justify-between rounded-lg border p-4 dark:border-slate-700">
            <div>
              <p className="font-medium">Auto Backup</p>
              <p className="text-muted-foreground text-sm">Automatically backup database</p>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={(checked) => setSettings({ ...settings, autoBackup: checked })}
            />
          </div>
          {settings.autoBackup && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Backup Frequency</label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm dark:bg-slate-900"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Info — live from API */}
      <Card className="dark:border-slate-700">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status from the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">System Status</p>
              <Badge className="gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                {statsLoading ? 'Checking…' : 'Healthy'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Total Users</p>
              <Badge variant="outline">{statsLoading ? '…' : users.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Active Users</p>
              <Badge variant="outline">{statsLoading ? '…' : activeUsers.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Roles Defined</p>
              <Badge variant="outline">{statsLoading ? '…' : roles.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Permissions Defined</p>
              <Badge variant="outline">{statsLoading ? '…' : totalPermissions}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Database</p>
              <Badge variant="outline">MongoDB</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        {saved && (
          <p className="text-sm font-medium text-green-600">Settings saved successfully!</p>
        )}
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
