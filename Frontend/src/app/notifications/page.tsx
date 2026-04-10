'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, AtSign, Trash2 } from 'lucide-react'
import { Notification } from '@/lib/types'

export default function NotificationsPage() {
  const { user } = useAuth()

  // Notifications will be wired to a notification service when available.
  // For now we keep an empty local state — no mock data.
  const [notifications, setNotifications] = useState<Notification[]>([])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={18} className="text-red-500" />
      case 'comment':
        return <MessageCircle size={18} className="text-blue-500" />
      case 'mention':
        return <AtSign size={18} className="text-purple-500" />
      default:
        return null
    }
  }

  const formatTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  return (
    <AuthLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="animate-fade-in mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-2 text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with what&apos;s happening</p>
          </div>
          {notifications.some((n) => !n.read) && (
            <Button variant="outline" onClick={handleMarkAllAsRead} className="text-primary">
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif, index) => (
              <Card
                key={notif.id}
                className={`animate-slide-down flex cursor-pointer items-center gap-4 p-4 transition-all hover:shadow-md ${
                  notif.read ? 'bg-white' : 'border-blue-200 bg-blue-50'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleMarkAsRead(notif.id)}
              >
                <div className="flex-shrink-0">{getNotificationIcon(notif.type)}</div>

                <div className="flex-1">
                  <p
                    className={`${notif.read ? 'text-muted-foreground' : 'text-foreground font-semibold'}`}
                  >
                    {notif.message}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatTime(notif.timestamp)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(notif.id)
                  }}
                  className="text-muted-foreground hover:text-destructive flex-shrink-0 p-2 transition-colors"
                >
                  <Trash2 size={18} />
                </button>

                {!notif.read && (
                  <div className="bg-primary animate-pulse-glow h-3 w-3 flex-shrink-0 rounded-full"></div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="animate-fade-in p-12 text-center">
            <div className="mb-4 text-5xl">🔔</div>
            <h2 className="text-foreground mb-2 text-xl font-semibold">No notifications</h2>
            <p className="text-muted-foreground">
              You&apos;re all caught up! Check back later for updates.
            </p>
          </Card>
        )}
      </div>
    </AuthLayout>
  )
}
