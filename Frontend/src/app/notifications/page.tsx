'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, AtSign, Trash2 } from 'lucide-react'
import { mockNotifications, mockUsers } from '@/lib/mock-data'
import { Notification } from '@/lib/types'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

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

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with what&apos;s happening</p>
          </div>
          {notifications.some(n => !n.read) && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="text-primary"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif, index) => {
              const notificationUser = mockUsers.find(u => u.name.includes('Sarah') || u.name.includes('Marcus') || u.name.includes('Emma'))
              
              return (
                <Card
                  key={notif.id}
                  className={`p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer animate-slide-down ${
                    notif.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleMarkAsRead(notif.id)}
                >
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1">
                    <p className={`${notif.read ? 'text-muted-foreground' : 'text-foreground font-semibold'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(notif.timestamp)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(notif.id)
                    }}
                    className="flex-shrink-0 p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>

                  {!notif.read && (
                    <div className="flex-shrink-0 w-3 h-3 rounded-full bg-primary animate-pulse-glow"></div>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="p-12 text-center animate-fade-in">
            <div className="text-5xl mb-4">🔔</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No notifications</h2>
            <p className="text-muted-foreground">You&apos;re all caught up! Check back later for updates.</p>
          </Card>
        )}
      </div>
    </AuthLayout>
  )
}
