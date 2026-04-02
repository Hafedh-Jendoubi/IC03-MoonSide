'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, Lock, Eye, Palette, Save, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react'
import { userApi, authApi, UpdateUserRequest, TwoFactorSetupResponse } from '@/lib/api'
import { getFullName } from '@/lib/types'

// ─── 2FA sub-panel ────────────────────────────────────────────────────────────

function TwoFactorPanel() {
  const [status, setStatus] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  // Setup flow
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null)
  const [confirmCode, setConfirmCode] = useState('')

  // Disable flow
  const [disableCode, setDisableCode] = useState('')
  const [showDisable, setShowDisable] = useState(false)

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const clearMsg = () => setMsg(null)

  // Load status on mount
  useEffect(() => {
    authApi
      .get2FAStatus()
      .then((s) => setStatus(s.twoFactorEnabled))
      .catch(() => setStatus(false))
      .finally(() => setLoading(false))
  }, [])

  const startSetup = async () => {
    clearMsg()
    setActionLoading(true)
    try {
      const data = await authApi.setup2FA()
      setSetupData(data)
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Setup failed' })
    } finally {
      setActionLoading(false)
    }
  }

  const confirmEnable = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMsg()
    setActionLoading(true)
    try {
      await authApi.enable2FA(confirmCode)
      setStatus(true)
      setSetupData(null)
      setConfirmCode('')
      setMsg({ type: 'success', text: '2FA has been enabled on your account.' })
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Invalid code' })
    } finally {
      setActionLoading(false)
    }
  }

  const confirmDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMsg()
    setActionLoading(true)
    try {
      await authApi.disable2FA(disableCode)
      setStatus(false)
      setShowDisable(false)
      setDisableCode('')
      setMsg({ type: 'success', text: '2FA has been disabled.' })
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Invalid code' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading 2FA status…</p>
  }

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${status ? 'bg-green-100' : 'bg-muted'}`}
        >
          {status ? (
            <ShieldCheck size={18} className="text-green-600" />
          ) : (
            <ShieldOff size={18} className="text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-foreground font-medium">
            {status ? 'Two-factor authentication is ON' : 'Two-factor authentication is OFF'}
          </p>
          <p className="text-muted-foreground text-sm">
            {status
              ? 'Your account is protected with an authenticator app.'
              : 'Add an extra layer of security to your account.'}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {msg && (
        <div
          className={`rounded-md border p-3 text-sm ${
            msg.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* ── Not enabled — show setup flow ─────────────────────────────────── */}
      {!status && !setupData && (
        <Button
          onClick={startSetup}
          disabled={actionLoading}
          className="bg-primary hover:bg-primary/90 gap-2 text-white"
        >
          <Smartphone size={16} />
          {actionLoading ? 'Preparing…' : 'Set Up 2FA'}
        </Button>
      )}

      {/* ── Setup: show QR code + confirm ─────────────────────────────────── */}
      {!status && setupData && (
        <div className="space-y-4 rounded-lg border p-4">
          <p className="text-foreground text-sm font-medium">
            Step 1 — Scan this QR code with your authenticator app
            <span className="text-muted-foreground ml-1 font-normal">
              (Google Authenticator, Authy, etc.)
            </span>
          </p>

          {setupData.qrCodeImage ? (
            <img
              src={setupData.qrCodeImage}
              alt="2FA QR Code"
              className="mx-auto h-48 w-48 rounded-md border"
            />
          ) : null}

          <div>
            <p className="text-muted-foreground mb-1 text-xs">Or enter this key manually:</p>
            <code className="bg-muted block rounded px-3 py-2 text-center text-sm tracking-widest break-all">
              {setupData.secret}
            </code>
          </div>

          <p className="text-foreground text-sm font-medium">
            Step 2 — Enter the 6-digit code from your app to confirm
          </p>

          <form onSubmit={confirmEnable} className="flex gap-2">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-lg tracking-widest"
              autoFocus
            />
            <Button
              type="submit"
              disabled={actionLoading || confirmCode.length !== 6}
              className="bg-primary hover:bg-primary/90 whitespace-nowrap text-white"
            >
              {actionLoading ? 'Verifying…' : 'Enable 2FA'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setSetupData(null)
              setConfirmCode('')
              clearMsg()
            }}
            className="text-muted-foreground hover:text-foreground text-sm hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── Enabled — show disable option ─────────────────────────────────── */}
      {status && !showDisable && (
        <Button
          variant="outline"
          onClick={() => {
            setShowDisable(true)
            clearMsg()
          }}
          className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
        >
          <ShieldOff size={16} />
          Disable 2FA
        </Button>
      )}

      {status && showDisable && (
        <div className="space-y-3 rounded-lg border border-red-200 p-4">
          <p className="text-foreground text-sm font-medium">
            Enter your current authenticator code to disable 2FA:
          </p>
          <form onSubmit={confirmDisable} className="flex gap-2">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-lg tracking-widest"
              autoFocus
            />
            <Button
              type="submit"
              disabled={actionLoading || disableCode.length !== 6}
              className="bg-red-600 whitespace-nowrap text-white hover:bg-red-700"
            >
              {actionLoading ? 'Disabling…' : 'Disable'}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => {
              setShowDisable(false)
              setDisableCode('')
              clearMsg()
            }}
            className="text-muted-foreground hover:text-foreground text-sm hover:underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Settings page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    jobTitle: user?.jobTitle ?? '',
    bio: user?.bio ?? '',
    phoneNumber: user?.phoneNumber ?? '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    privateProfile: false,
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleProfileChange = (field: keyof typeof profileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleProfileSave = async () => {
    if (!user) return
    setProfileSaving(true)
    setProfileMessage(null)
    try {
      const payload: UpdateUserRequest = {
        firstName: profileForm.firstName || undefined,
        lastName: profileForm.lastName || undefined,
        jobTitle: profileForm.jobTitle || undefined,
        bio: profileForm.bio || undefined,
        phoneNumber: profileForm.phoneNumber || undefined,
      }
      await userApi.update(user.id, payload)
      await refreshUser()
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save changes.',
      })
    } finally {
      setProfileSaving(false)
    }
  }

  const displayName = user ? getFullName(user) : ''

  return (
    <AuthLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="animate-fade-in mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        {/* Profile Section */}
        <Card className="animate-scale-in mb-6 p-6">
          <h2 className="text-foreground mb-6 flex items-center gap-2 text-2xl font-bold">
            <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-full">
              👤
            </div>
            Profile
          </h2>

          <div className="mb-6 flex items-center gap-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold">
                {user?.firstName?.[0]?.toUpperCase()}
                {user?.lastName?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-foreground font-semibold">{displayName}</p>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>

          {profileMessage && (
            <div
              className={`mb-4 rounded-md border p-3 text-sm ${
                profileMessage.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-600'
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">First Name</label>
                <Input
                  value={profileForm.firstName}
                  onChange={(e) => handleProfileChange('firstName', e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">Last Name</label>
                <Input
                  value={profileForm.lastName}
                  onChange={(e) => handleProfileChange('lastName', e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Job Title</label>
              <Input
                value={profileForm.jobTitle}
                onChange={(e) => handleProfileChange('jobTitle', e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Phone Number</label>
              <Input
                value={profileForm.phoneNumber}
                onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Bio</label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                placeholder="Tell people a bit about yourself..."
                rows={3}
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
              />
            </div>

            <Button
              onClick={handleProfileSave}
              disabled={profileSaving}
              className="bg-primary hover:bg-primary/90 gap-2 text-white"
            >
              <Save size={16} />
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </Card>

        {/* Notifications Section */}
        <Card className="animate-slide-up mb-6 p-6">
          <h2 className="text-foreground mb-6 flex items-center gap-2 text-2xl font-bold">
            <Bell size={24} className="text-primary" />
            Notifications
          </h2>
          <div className="space-y-4">
            {[
              {
                key: 'emailNotifications' as const,
                label: 'Email Notifications',
                desc: 'Get notified via email about activities',
              },
              {
                key: 'pushNotifications' as const,
                label: 'Push Notifications',
                desc: 'Receive browser notifications in real-time',
              },
            ].map(({ key, label, desc }) => (
              <label
                key={key}
                className="hover:bg-muted flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={() => handleToggle(key)}
                  className="border-border accent-primary h-5 w-5 rounded"
                />
                <div className="flex-1">
                  <p className="text-foreground font-medium">{label}</p>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Privacy Section */}
        <Card className="animate-slide-up mb-6 p-6" style={{ animationDelay: '100ms' }}>
          <h2 className="text-foreground mb-6 flex items-center gap-2 text-2xl font-bold">
            <Eye size={24} className="text-primary" />
            Privacy
          </h2>
          <div className="space-y-4">
            <label className="hover:bg-muted flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors">
              <input
                type="checkbox"
                checked={settings.privateProfile}
                onChange={() => handleToggle('privateProfile')}
                className="border-border accent-primary h-5 w-5 rounded"
              />
              <div className="flex-1">
                <p className="text-foreground font-medium">Private Profile</p>
                <p className="text-muted-foreground text-sm">
                  Only approved people can see your profile
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Display Section */}
        <Card className="animate-slide-up mb-6 p-6" style={{ animationDelay: '200ms' }}>
          <h2 className="text-foreground mb-6 flex items-center gap-2 text-2xl font-bold">
            <Palette size={24} className="text-primary" />
            Display
          </h2>
          <div className="space-y-4">
            <label className="hover:bg-muted flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="border-border accent-primary h-5 w-5 rounded"
              />
              <div className="flex-1">
                <p className="text-foreground font-medium">Dark Mode</p>
                <p className="text-muted-foreground text-sm">
                  {theme === 'dark'
                    ? 'Dark mode is enabled'
                    : 'Enable dark mode for your interface'}
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Security Section — 2FA lives here */}
        <Card className="animate-slide-up mb-6 p-6" style={{ animationDelay: '300ms' }}>
          <h2 className="text-foreground mb-6 flex items-center gap-2 text-2xl font-bold">
            <Lock size={24} className="text-primary" />
            Security
          </h2>
          <TwoFactorPanel />
        </Card>
      </div>
    </AuthLayout>
  )
}
