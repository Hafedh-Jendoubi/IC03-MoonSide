'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, Lock, Eye, Palette, Save } from 'lucide-react'
import { userApi, UpdateUserRequest } from '@/lib/api'
import { getFullName } from '@/lib/types'

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()

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
    darkMode: false,
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

          {/* Avatar preview */}
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
            <label className="hover:bg-muted flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                className="border-border accent-primary h-5 w-5 rounded"
              />
              <div className="flex-1">
                <p className="text-foreground font-medium">Email Notifications</p>
                <p className="text-muted-foreground text-sm">
                  Get notified via email about activities
                </p>
              </div>
            </label>

            <label className="hover:bg-muted flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
                className="border-border accent-primary h-5 w-5 rounded"
              />
              <div className="flex-1">
                <p className="text-foreground font-medium">Push Notifications</p>
                <p className="text-muted-foreground text-sm">
                  Receive browser notifications in real-time
                </p>
              </div>
            </label>
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
                checked={settings.darkMode}
                onChange={() => handleToggle('darkMode')}
                disabled
                className="border-border accent-primary h-5 w-5 rounded opacity-50"
              />
              <div className="flex-1">
                <p className="text-foreground font-medium">Dark Mode</p>
                <p className="text-muted-foreground text-sm">Coming soon</p>
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

          <Button variant="outline" className="w-full">
            Change Password
          </Button>
        </Card>
      </div>
    </AuthLayout>
  )
}
