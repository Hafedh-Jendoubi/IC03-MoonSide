'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/auth-context'
import { canAccessBackOffice, getFullName } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Home,
  Mail,
  Bell,
  Search,
  LogOut,
  Settings,
  User,
  Users,
  FileText,
  Shield,
  Compass,
  Bookmark,
  MessageCircle,
  Heart,
  AtSign,
  Pin,
  Moon,
  Sun,
  Loader2,
  X,
} from 'lucide-react'
import { NotificationType } from '@/lib/types'
import { useNotifications } from '@/hooks/use-notifications'
import { useSearch } from '@/hooks/use-search'
import { NotificationToast } from '@/components/notification-toast'
import type { SearchResultItem } from '@/lib/api/types/search'

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

function SearchResultRow({ item, onClick }: { item: SearchResultItem; onClick: () => void }) {
  const initials =
    item.title
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'

  return (
    <button
      onClick={onClick}
      className="hover:bg-muted flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors"
    >
      {item.type === 'POST' ? (
        <span className="bg-muted text-muted-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
          <FileText size={16} />
        </span>
      ) : (
        <Avatar className="h-8 w-8 flex-shrink-0">
          {item.imageUrl && <AvatarImage src={item.imageUrl} alt={item.title} />}
          <AvatarFallback className="text-xs font-semibold">
            {item.type === 'TEAM' ? <Users size={14} /> : initials}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0">
        <p className="text-foreground truncate font-medium">{item.title}</p>
        {item.subtitle && <p className="text-muted-foreground truncate text-xs">{item.subtitle}</p>}
      </div>
    </button>
  )
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
  const searchRef = useRef<HTMLDivElement>(null)

  const { query, results, isLoading, isOpen, setIsOpen, hasResults, onQueryChange, clear } =
    useSearch()

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
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setIsOpen])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleSelectResult = (item: SearchResultItem) => {
    clear()
    if (item.type === 'USER') {
      router.push(`/profile/${item.id}`)
    } else if (item.type === 'TEAM') {
      router.push(`/team/${item.id}`)
    } else {
      router.push(item.teamId ? `/team/${item.teamId}` : '/feed')
    }
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
            <div className="mx-8 hidden max-w-sm flex-1 lg:flex" ref={searchRef}>
              <div className="relative w-full">
                <Search
                  className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 transform"
                  size={18}
                />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onFocus={() => query.trim().length > 0 && setIsOpen(true)}
                  onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
                  placeholder="Search people, posts, teams..."
                  className="bg-muted pr-9 pl-10"
                />
                {query && (
                  <button
                    onClick={clear}
                    aria-label="Clear search"
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transform"
                  >
                    <X size={16} />
                  </button>
                )}

                {isOpen && (
                  <div className="border-border animate-slide-down bg-background absolute left-0 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border shadow-lg dark:shadow-xl">
                    {query.trim().length < 2 ? (
                      <p className="text-muted-foreground px-4 py-6 text-center text-sm">
                        Keep typing to search…
                      </p>
                    ) : isLoading ? (
                      <p className="text-muted-foreground flex items-center justify-center gap-2 px-4 py-6 text-center text-sm">
                        <Loader2 size={14} className="animate-spin" />
                        Searching…
                      </p>
                    ) : !hasResults ? (
                      <p className="text-muted-foreground px-4 py-6 text-center text-sm">
                        No results for &ldquo;{query}&rdquo;
                      </p>
                    ) : (
                      <div className="p-2">
                        {results.users.length > 0 && (
                          <div className="mb-1">
                            <p className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                              People
                            </p>
                            {results.users.map((item) => (
                              <SearchResultRow
                                key={`user-${item.id}`}
                                item={item}
                                onClick={() => handleSelectResult(item)}
                              />
                            ))}
                          </div>
                        )}
                        {results.teams.length > 0 && (
                          <div className="mb-1">
                            <p className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                              Teams
                            </p>
                            {results.teams.map((item) => (
                              <SearchResultRow
                                key={`team-${item.id}`}
                                item={item}
                                onClick={() => handleSelectResult(item)}
                              />
                            ))}
                          </div>
                        )}
                        {results.posts.length > 0 && (
                          <div>
                            <p className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                              Posts
                            </p>
                            {results.posts.map((item) => (
                              <SearchResultRow
                                key={`post-${item.id}`}
                                item={item}
                                onClick={() => handleSelectResult(item)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
