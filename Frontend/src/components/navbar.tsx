'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getFullName } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { Heart, Mail, Bell, Search, LogOut, Settings, User, Shield } from 'lucide-react'

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
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
    { href: '/feed', label: 'Feed', icon: Heart },
    { href: '/messages', label: 'Messages', icon: Mail },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ]

  const displayName = user ? getFullName(user) : ''
  const avatarSrc = user?.avatar || '/placeholder-user.jpg'

  return (
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
          <div className="hidden items-center gap-1 md:flex">
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
              <Input type="text" placeholder="Search people, posts..." className="bg-muted pl-10" />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Admin Panel Link */}
            <Link href="/admin/dashboard">
              <Button variant="outline" size="icon" title="Admin Panel">
                <Shield size={20} />
              </Button>
            </Link>

            {/* Notification Bell */}
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
              </Button>
            </Link>

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
                    <div className="border-primary bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold">
                      {user.firstName?.[0]?.toUpperCase()}
                      {user.lastName?.[0]?.toUpperCase()}
                    </div>
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="border-border animate-slide-down bg-background absolute right-0 mt-2 w-56 rounded-lg border shadow-lg dark:shadow-xl">
                    {/* User Info */}
                    <div className="border-border border-b px-4 py-3">
                      <p className="text-foreground text-sm font-semibold">{displayName}</p>
                      <p className="text-muted-foreground text-xs">{user.email}</p>
                      {user.jobTitle && (
                        <p className="text-muted-foreground mt-1 text-xs">{user.jobTitle}</p>
                      )}
                    </div>

                    {/* Menu Items */}
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
                    </div>

                    {/* Logout */}
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
  )
}
