'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth()

  return (
    <RoleGuard requiredRoles="backoffice">
      {/* Wait for auth to be ready before rendering sidebar to prevent hydration mismatches */}
      {!isLoading && (
        <div className="flex">
          <AdminSidebar isOpen={true} />
          <main className="ml-64 w-[calc(100%-256px)]">{children}</main>
        </div>
      )}
    </RoleGuard>
  )
}
