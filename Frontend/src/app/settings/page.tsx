'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Lock, Eye, Palette, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { authApi, TwoFactorSetupResponse } from '@/lib/api'
import { getFullName } from '@/lib/types'
import { useRouter } from 'next/navigation'

// ─── 2FA sub-panel ────────────────────────────────────────────────────────────

function TwoFactorPanel() {
  const [status, setStatus] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null)
  const [confirmCode, setConfirmCode] = useState('')

  const [disableCode, setDisableCode] = useState('')
  const [showDisable, setShowDisable] = useState(false)

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const clearMsg = () => setMsg(null)

  // Load status on mount
  useState(() => {
    authApi
      .get2FAStatus()
      .then((s) => setStatus(s.twoFactorEnabled))
      .catch(() => setStatus(false))
      .finally(() => setLoading(false))
  })

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
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    privateProfile: false,
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
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

        {/* Profile Quick-link Card */}
        <Card className="animate-scale-in mb-6 p-5">
          <div className="flex items-center gap-4">
            {/* Static avatar display */}
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className="ring-primary/20 h-14 w-14 flex-shrink-0 rounded-full object-cover ring-2"
              />
            ) : (
              <div className="bg-primary/10 text-primary ring-primary/20 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ring-2">
                {user?.firstName?.[0]?.toUpperCase()}
                {user?.lastName?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate font-semibold">{displayName}</p>
              <p className="text-muted-foreground truncate text-sm">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => user && router.push(`/profile/${user.id}`)}
              className="shrink-0"
            >
              Edit Profile
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

        {/* Security Section */}
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
