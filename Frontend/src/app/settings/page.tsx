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
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        {/* Profile Section */}
        <Card className="p-6 mb-6 animate-scale-in">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              👤
            </div>
            Profile
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline">Change Photo</Button>
            </div>
          </div>
        </Card>

        {/* Notifications Section */}
        <Card className="p-6 mb-6 animate-slide-up">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Bell size={24} className="text-primary" />
            Notifications
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-4 cursor-pointer hover:bg-muted p-3 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                className="w-5 h-5 rounded border-border accent-primary"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified via email about activities</p>
              </div>
            </label>

            <label className="flex items-center gap-4 cursor-pointer hover:bg-muted p-3 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
                className="w-5 h-5 rounded border-border accent-primary"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive browser notifications in real-time</p>
              </div>
            </label>
          </div>
        </Card>

        {/* Privacy Section */}
        <Card className="p-6 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Eye size={24} className="text-primary" />
            Privacy
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-4 cursor-pointer hover:bg-muted p-3 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={settings.privateProfile}
                onChange={() => handleToggle('privateProfile')}
                className="w-5 h-5 rounded border-border accent-primary"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">Private Profile</p>
                <p className="text-sm text-muted-foreground">Only approved people can see your profile</p>
              </div>
            </label>
          </div>
        </Card>

        {/* Display Section */}
        <Card className="p-6 mb-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Palette size={24} className="text-primary" />
            Display
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-4 cursor-pointer hover:bg-muted p-3 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={() => handleToggle('darkMode')}
                disabled
                className="w-5 h-5 rounded border-border accent-primary opacity-50"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </label>
          </div>
        </Card>

        {/* Security Section */}
        <Card className="p-6 mb-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Lock size={24} className="text-primary" />
            Security
          </h2>

          <Button variant="outline" className="w-full">
            Change Password
          </Button>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}
