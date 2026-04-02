'use client'

import { useAuth } from '@/lib/auth-context'
import { isAdmin } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'

interface RoleGuardProps {
  children: React.ReactNode
  /** Which role is required to see the children. Defaults to 'admin'. */
  requiredRole?: string
  fallback?: React.ReactNode
}

export function RoleGuard({ children, requiredRole = 'admin', fallback }: RoleGuardProps) {
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

  // Check if user holds the required role (case-insensitive)
  const hasRequiredRole = user.roles.some((r) => r.toLowerCase() === requiredRole.toLowerCase())

  if (!hasRequiredRole) {
    return (
      fallback || (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
          <button onClick={() => router.push('/feed')} className="text-primary hover:underline">
            Go back to feed
          </button>
        </div>
      )
    )
  }

  return <>{children}</>
}
