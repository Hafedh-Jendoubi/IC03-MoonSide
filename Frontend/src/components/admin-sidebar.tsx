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
import { useAuth } from '@/lib/auth-context'
import { hasFullBackOfficeAccess, PERM, hasAnyPermission } from '@/lib/types'

interface AdminSidebarProps {
  isOpen?: boolean
}

interface SidebarLink {
  href: string
  label: string
  icon: React.ElementType
  description: string
  /** If supplied, link is shown only when user holds at least one of these permissions. */
  requiredPermissions?: string[]
}

export function AdminSidebar({ isOpen = true }: AdminSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isCEO = hasFullBackOfficeAccess(user)

  const allLinks: SidebarLink[] = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Analytics & overview',
      // HR (BACKOFFICE_DASHBOARD_READ) and CEO (ANYTHING) both get this
      requiredPermissions: [PERM.BACKOFFICE_DASHBOARD_READ, PERM.ANYTHING],
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: Users,
      description: 'Manage users',
      // HR (USER_READ_ALL) and CEO both get this
      requiredPermissions: [PERM.USER_READ_ALL, PERM.ANYTHING],
    },
    {
      href: '/admin/roles',
      label: 'Roles & Permissions',
      icon: Shield,
      description: 'Manage roles & permissions',
      // CEO only
      requiredPermissions: [PERM.ANYTHING],
    },
    {
      href: '/admin/organizations',
      label: 'Organizations',
      icon: Building2,
      description: 'Departments & teams',
      // HR (ORG_READ) and CEO both get this
      requiredPermissions: [PERM.ORG_READ, PERM.ANYTHING],
    },
    {
      href: '/admin/audit-logs',
      label: 'Audit Logs',
      icon: ClipboardList,
      description: 'Activity & security trail',
      // CEO only
      requiredPermissions: [PERM.ANYTHING],
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
      description: 'System settings',
      // CEO only
      requiredPermissions: [PERM.ANYTHING],
    },
  ]

  // Filter links by what the current user is allowed to see
  const visibleLinks = allLinks.filter((link) => {
    if (!link.requiredPermissions) return true
    return hasAnyPermission(user, ...link.requiredPermissions)
  })

  if (!isOpen) return null

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
          {isCEO ? 'Administration' : 'HR Office'}
        </p>
        {visibleLinks.map((link) => {
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
