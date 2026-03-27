'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Lock, Eye, Palette } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    privateProfile: false,
    darkMode: false,
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

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

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="h-16 w-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-foreground font-semibold">{user?.name}</p>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
              </div>
              <Button variant="outline">Change Photo</Button>
            </div>
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

        {/* Save Button */}
        <div className="animate-slide-up flex gap-3" style={{ animationDelay: '400ms' }}>
          <Button className="bg-primary hover:bg-primary/90 flex-1 text-white">Save Changes</Button>
        </div>
      </div>
    </AuthLayout>
  )
}
