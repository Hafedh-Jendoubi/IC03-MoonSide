'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  Shield,
  BarChart3,
  Settings,
  ArrowLeft,
  ClipboardList,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  isOpen?: boolean
}

export function AdminSidebar({ isOpen = true }: AdminSidebarProps) {
  const pathname = usePathname()

  const adminLinks = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Analytics & overview',
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: Users,
      description: 'Manage users',
    },
    {
      href: '/admin/roles',
      label: 'Roles',
      icon: Shield,
      description: 'Manage roles & permissions',
    },
    {
      href: '/admin/organizations',
      label: 'Organizations',
      icon: Building2,
      description: 'Departments & teams',
    },
    {
      href: '/admin/audit-logs',
      label: 'Audit Logs',
      icon: ClipboardList,
      description: 'Activity & security trail',
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
      description: 'System settings',
    },
  ]

  if (!isOpen) {
    return null
  }

  return (
    <aside className="border-border bg-background fixed top-0 left-0 h-screen w-64 overflow-y-auto border-r dark:bg-slate-950">
      {/* Header with back button */}
      <div className="border-border border-b p-4">
        <Link href="/feed">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
            <ArrowLeft size={16} />
            <span>Back to WorkSphere</span>
          </Button>
        </Link>
      </div>

      {/* Navigation links */}
      <nav className="space-y-1 p-3">
        <p className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wider uppercase">
          Administration
        </p>
        {adminLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon size={16} className="flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p>{link.label}</p>
                  <p
                    className={cn(
                      'truncate text-xs',
                      isActive ? 'text-primary/70' : 'text-muted-foreground/70'
                    )}
                  >
                    {link.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
