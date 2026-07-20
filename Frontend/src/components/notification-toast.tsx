'use client'

import { useEffect, useState } from 'react'
import { X, Bell, MessageCircle, Heart, Pin, UserPlus, UserCheck } from 'lucide-react'
import { Notification, NotificationType } from '@/lib/types'

interface NotificationToastProps {
  notification: Notification | null
  onDismiss: () => void
}

function getIcon(type: NotificationType) {
  switch (type) {
    case 'COMMENT':
      return <MessageCircle size={18} className="text-blue-500" />
    case 'REACTION':
      return <Heart size={18} className="text-rose-500" />
    case 'POST_PINNED':
      return <Pin size={18} className="text-amber-500" />
    case 'CONNECTION_REQUEST':
      return <UserPlus size={18} className="text-emerald-500" />
    case 'CONNECTION_ACCEPTED':
      return <UserCheck size={18} className="text-emerald-500" />
    default:
      return <Bell size={18} className="text-primary" />
  }
}

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!notification) return
    setLeaving(false)
    setVisible(true)

    const autoClose = setTimeout(() => dismiss(), 5000)
    return () => clearTimeout(autoClose)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification?.id])

  const dismiss = () => {
    setLeaving(true)
    setTimeout(() => {
      setVisible(false)
      onDismiss()
    }, 300)
  }

  if (!visible || !notification) return null

  return (
    <div
      className={`border-border bg-background fixed right-6 bottom-6 z-[9999] flex max-w-sm items-start gap-3 rounded-xl border p-4 shadow-2xl transition-all duration-300 ${
        leaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{ minWidth: '300px' }}
    >
      <div className="mt-0.5 flex-shrink-0">{getIcon(notification.notificationType)}</div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-sm font-semibold">{notification.title}</p>
        <p className="text-muted-foreground mt-0.5 truncate text-sm">{notification.body}</p>
      </div>
      <button
        onClick={dismiss}
        className="text-muted-foreground hover:bg-muted hover:text-foreground flex-shrink-0 rounded-md p-1 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
