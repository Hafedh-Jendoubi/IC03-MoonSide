'use client'

import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bell,
  MessageCircle,
  Heart,
  AtSign,
  Pin,
  Star,
  Megaphone,
  Trash2,
  CheckCheck,
  Loader2,
  UserPlus,
  UserCheck,
} from 'lucide-react'
import { NotificationType } from '@/lib/types'
import { useNotifications } from '@/hooks/use-notifications'

function getIcon(type: NotificationType) {
  switch (type) {
    case 'COMMENT':
      return <MessageCircle size={18} className="text-blue-500" />
    case 'REACTION':
      return <Heart size={18} className="text-rose-500" />
    case 'MENTION':
      return <AtSign size={18} className="text-purple-500" />
    case 'POST_PINNED':
      return <Pin size={18} className="text-amber-500" />
    case 'BADGE_EARNED':
      return <Star size={18} className="text-yellow-500" />
    case 'ANNOUNCEMENT':
      return <Megaphone size={18} className="text-emerald-500" />
    case 'CONNECTION_REQUEST':
      return <UserPlus size={18} className="text-emerald-500" />
    case 'CONNECTION_ACCEPTED':
      return <UserCheck size={18} className="text-emerald-500" />
    default:
      return <Bell size={18} className="text-primary" />
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
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

export default function NotificationsPage() {
  const { user } = useAuth()
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user?.id)

  return (
    <AuthLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-muted-foreground text-sm">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
              <CheckCheck size={16} />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {notifications.length === 0 && !isLoading ? (
            <Card className="py-16 text-center">
              <Bell className="text-muted-foreground mx-auto mb-3" size={40} />
              <p className="text-muted-foreground text-sm">No notifications yet</p>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`flex items-start gap-3 p-4 transition-colors ${
                  notif.isRead ? '' : 'border-primary/30 bg-blue-50/50 dark:bg-blue-950/20'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">{getIcon(notif.notificationType)}</div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm ${notif.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}
                  >
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="text-muted-foreground mt-0.5 text-sm">{notif.body}</p>
                  )}
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatTime(notif.createdAt)}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  {!notif.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notif.id)}
                      className="h-7 px-2 text-xs"
                    >
                      Mark read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNotification(notif.id)}
                    className="text-muted-foreground hover:text-destructive h-7 w-7"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))
          )}

          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 size={24} className="text-muted-foreground animate-spin" />
            </div>
          )}

          {hasMore && !isLoading && (
            <div className="pt-4 text-center">
              <Button variant="outline" onClick={fetchMore}>
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
