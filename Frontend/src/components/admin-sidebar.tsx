'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Shield, BarChart3, Settings, ArrowLeft } from 'lucide-react'
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

      <nav className="space-y-2 p-4">
        <p className="text-muted-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
          Admin Panel
        </p>
        {adminLinks.map(({ href, label, icon: Icon, description }) => {
          const isActive = pathname === href
          return (
            <Link key={href} href={href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn('w-full justify-start gap-3 px-4 py-6', isActive && 'shadow-md')}
              >
                <Icon size={18} />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs opacity-60">{description}</span>
                </div>
              </Button>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
