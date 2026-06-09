'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/auth-context'
import { canAccessBackOffice, getFullName } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Home,
  Mail,
  Bell,
  Search,
  LogOut,
  Settings,
  User,
  Shield,
  Compass,
  Bookmark,
  MessageCircle,
  Heart,
  AtSign,
  Pin,
  Moon,
  Sun,
} from 'lucide-react'
import { NotificationType } from '@/lib/types'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationToast } from '@/components/notification-toast'

function NotifIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'COMMENT':
      return <MessageCircle size={14} className="text-blue-500" />
    case 'REACTION':
      return <Heart size={14} className="text-rose-500" />
    case 'MENTION':
      return <AtSign size={14} className="text-purple-500" />
    case 'POST_PINNED':
      return <Pin size={14} className="text-amber-500" />
    default:
      return <Bell size={14} className="text-primary" />
  }
}

export function Navbar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  const { notifications, unreadCount, markAsRead, markAllAsRead, latestPush, clearLatestPush } =
    useNotifications(user?.id)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const navLinks = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/messages', label: 'Messages', icon: Mail },
    { href: '/discover', label: 'Discover', icon: Compass },
  ]

  const displayName = user ? getFullName(user) : ''
  const avatarSrc = user?.avatar || '/placeholder-user.jpg'

  return (
    <>
      <NotificationToast notification={latestPush} onDismiss={clearLatestPush} />

      <nav className="border-border bg-background fixed top-0 right-0 left-0 z-50 border-b shadow-sm dark:shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/feed" className="text-primary flex items-center gap-2 text-xl font-bold">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white">
                WS
              </div>
              <span>WorkSphere</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden items-center gap-2 md:flex">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <Button variant={pathname === href ? 'default' : 'ghost'} className="gap-2">
                    <Icon size={18} />
                    {label}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Search Bar */}
            <div className="mx-8 hidden max-w-sm flex-1 lg:flex">
              <div className="relative w-full">
                <Search
                  className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 transform"
                  size={18}
                />
                <Input
                  type="text"
                  placeholder="Search people, posts..."
                  className="bg-muted pl-10"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-foreground hover:bg-muted rounded-md p-2 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Notifications Dropdown */}
              {user && (
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative transition-opacity hover:opacity-80"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="border-border animate-slide-down bg-background absolute right-0 mt-2 w-80 rounded-lg border shadow-lg dark:shadow-xl">
                      {/* Header */}
                      <div className="border-border flex items-center justify-between border-b px-4 py-3">
                        <p className="text-foreground text-sm font-semibold">
                          Notifications{' '}
                          {unreadCount > 0 && <span className="text-primary">({unreadCount})</span>}
                        </p>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-primary text-xs hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.slice(0, 8).length > 0 ? (
                          notifications.slice(0, 8).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                if (!notif.isRead) markAsRead(notif.id)
                              }}
                              className={`border-border hover:bg-muted cursor-pointer border-b px-4 py-3 text-sm transition-colors ${
                                notif.isRead ? '' : 'bg-blue-50 dark:bg-blue-950/40'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 flex-shrink-0">
                                  <NotifIcon type={notif.notificationType} />
                                </span>
                                <div className="min-w-0">
                                  <p
                                    className={
                                      notif.isRead
                                        ? 'text-muted-foreground'
                                        : 'text-foreground font-medium'
                                    }
                                  >
                                    {notif.title}
                                  </p>
                                  {notif.body && (
                                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                      {notif.body}
                                    </p>
                                  )}
                                  <p className="text-muted-foreground mt-1 text-xs">
                                    {new Date(notif.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-muted-foreground px-4 py-6 text-center text-sm">
                            No notifications yet
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="border-border border-t p-2">
                        <Link href="/notifications" onClick={() => setIsNotificationsOpen(false)}>
                          <button className="text-primary hover:bg-muted flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors">
                            View All Notifications
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Avatar Dropdown */}
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 transition-opacity hover:opacity-80"
                  >
                    {user.avatar ? (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        className="border-primary h-10 w-10 rounded-full border-2 object-cover"
                      />
                    ) : (
                      <div className="border-primary bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold">
                        {user.firstName?.[0]?.toUpperCase()}
                        {user.lastName?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </button>

                  {isDropdownOpen && (
                    <div className="border-border animate-slide-down bg-background absolute right-0 mt-2 w-56 rounded-lg border shadow-lg dark:shadow-xl">
                      <div className="border-border border-b px-4 py-3">
                        <p className="text-foreground text-sm font-semibold">{displayName}</p>
                        <p className="text-muted-foreground text-xs">{user.email}</p>
                        {user.jobTitle && (
                          <p className="text-muted-foreground mt-1 text-xs">{user.jobTitle}</p>
                        )}
                      </div>

                      <div className="p-2">
                        <Link href={`/profile/${user.id}`}>
                          <button
                            onClick={() => setIsDropdownOpen(false)}
                            className="text-foreground hover:bg-muted flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                          >
                            <User size={16} />
                            View Profile
                          </button>
                        </Link>
                        <Link href="/settings">
                          <button
                            onClick={() => setIsDropdownOpen(false)}
                            className="text-foreground hover:bg-muted flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                          >
                            <Settings size={16} />
                            Settings
                          </button>
                        </Link>
                        <Link href="/saved">
                          <button
                            onClick={() => setIsDropdownOpen(false)}
                            className="text-foreground hover:bg-muted flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                          >
                            <Bookmark size={16} />
                            Saved Posts
                          </button>
                        </Link>
                        {canAccessBackOffice(user) && (
                          <Link href="/admin/dashboard">
                            <button
                              onClick={() => setIsDropdownOpen(false)}
                              className="text-foreground hover:bg-muted flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                            >
                              <Shield size={16} />
                              Back Office
                            </button>
                          </Link>
                        )}
                      </div>

                      <div className="border-border border-t px-2 py-2">
                        <button
                          onClick={handleLogout}
                          className="text-destructive hover:bg-muted flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
