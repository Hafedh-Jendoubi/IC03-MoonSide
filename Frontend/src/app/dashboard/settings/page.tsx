'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Bell, Lock, Shield, Eye, Mail } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState('account');

  return (
    <DashboardLayout className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-foreground-secondary mt-1">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tabs */}
          <div className="md:col-span-1">
            <div className="space-y-2">
              {[
                { id: 'account', label: 'Account', icon: Lock },
                { id: 'privacy', label: 'Privacy & Safety', icon: Shield },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'visibility', label: 'Visibility', icon: Eye },
                { id: 'email', label: 'Email', icon: Mail },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-colors text-left ${
                    activeTab === id
                      ? 'bg-primary text-white'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {activeTab === 'account' && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Update your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="First Name" value="John" onChange={() => {}} />
                    <Input label="Last Name" value="Doe" onChange={() => {}} />
                  </div>
                  <Input label="Email Address" type="email" value="john@example.com" onChange={() => {}} />
                  <Input label="Phone Number" type="tel" value="+1 (555) 123-4567" onChange={() => {}} />
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value="Senior Product Designer"
                      onChange={() => {}}
                      className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="primary">Save Changes</Button>
                    <Button variant="outline">Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Safety</CardTitle>
                  <CardDescription>Control who can see your profile and contact you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      title: 'Profile Visibility',
                      description: 'Allow people to find your profile through search',
                      checked: true,
                    },
                    {
                      title: 'Show Activity Status',
                      description: 'Let others see when you are active',
                      checked: true,
                    },
                    {
                      title: 'Allow Direct Messages',
                      description: 'Let anyone send you direct messages',
                      checked: false,
                    },
                    {
                      title: 'Show Email Address',
                      description: 'Display your email on your profile',
                      checked: false,
                    },
                  ].map((setting, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{setting.title}</p>
                        <p className="text-sm text-foreground-secondary">{setting.description}</p>
                      </div>
                      <input type="checkbox" defaultChecked={setting.checked} className="w-5 h-5" />
                    </div>
                  ))}
                  <Button variant="primary" className="mt-4">Save Preferences</Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      title: 'Connection Requests',
                      description: 'When someone requests to connect with you',
                      checked: true,
                    },
                    {
                      title: 'Messages',
                      description: 'When you receive a new message',
                      checked: true,
                    },
                    {
                      title: 'Comments & Reactions',
                      description: 'When people comment on or react to your posts',
                      checked: true,
                    },
                    {
                      title: 'Group Updates',
                      description: 'Updates from groups you are a member of',
                      checked: true,
                    },
                    {
                      title: 'Course Updates',
                      description: 'Updates about your enrolled courses',
                      checked: false,
                    },
                  ].map((setting, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{setting.title}</p>
                        <p className="text-sm text-foreground-secondary">{setting.description}</p>
                      </div>
                      <input type="checkbox" defaultChecked={setting.checked} className="w-5 h-5" />
                    </div>
                  ))}
                  <Button variant="primary" className="mt-4">Save Preferences</Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'visibility' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Visibility</CardTitle>
                  <CardDescription>Control what information is visible on your profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { label: 'Show followers count', checked: true },
                    { label: 'Show following count', checked: true },
                    { label: 'Show connection history', checked: false },
                    { label: 'Show last login', checked: false },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-2">
                      <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4" />
                      <label className="text-foreground text-sm">{item.label}</label>
                    </div>
                  ))}
                  <Button variant="primary">Apply Changes</Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'email' && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Preferences</CardTitle>
                  <CardDescription>Manage your email subscriptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Input label="Primary Email" type="email" value="john@example.com" onChange={() => {}} />
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Email Frequency
                    </label>
                    <select className="w-full px-3 py-2 border border-border rounded bg-background text-foreground">
                      <option>Daily Digest</option>
                      <option>Weekly Digest</option>
                      <option>Monthly Digest</option>
                      <option>Only Important</option>
                    </select>
                  </div>
                  <Button variant="primary">Update Preferences</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
