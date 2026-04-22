'use client'

import { useAuth } from '@/lib/auth-context'
import { canAccessBackOffice, hasAnyPermission, hasRole } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'

interface RoleGuardProps {
  children: React.ReactNode
  /**
   * One or more role names — user must hold AT LEAST ONE.
   * Pass 'backoffice' as a special value to check canAccessBackOffice().
   */
  requiredRoles?: string | string[]
  /**
   * One or more permission strings — user must hold AT LEAST ONE.
   * Checked in addition to (not instead of) requiredRoles when both are set.
   */
  requiredPermissions?: string | string[]
  fallback?: React.ReactNode
}

export function RoleGuard({
  children,
  requiredRoles,
  requiredPermissions,
  fallback,
}: RoleGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return (
      fallback || <div className="flex h-screen items-center justify-center">Redirecting...</div>
    )
  }

  // ── Role check ──────────────────────────────────────────────────────────────
  if (requiredRoles !== undefined) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

    // Special value: 'backoffice' — HR or CEO
    const passesRole = roles.includes('backoffice')
      ? canAccessBackOffice(user)
      : roles.some((r) => hasRole(user, r))

    if (!passesRole) {
      return fallback || <AccessDenied onBack={() => router.push('/feed')} />
    }
  }

  // ── Permission check (additive — only checked if also provided) ─────────────
  if (requiredPermissions !== undefined) {
    const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]

    if (!hasAnyPermission(user, ...perms)) {
      return fallback || <AccessDenied onBack={() => router.push('/feed')} />
    }
  }

  return <>{children}</>
}

function AccessDenied({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">You do not have permission to access this page.</p>
      <button onClick={onBack} className="text-primary hover:underline">
        Go back to feed
      </button>
    </div>
  )
}
