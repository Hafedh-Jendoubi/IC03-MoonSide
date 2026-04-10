import { AdminSidebar } from '@/components/admin-sidebar'
import { RoleGuard } from '@/components/role-guard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="admin">
      <div className="flex">
        <AdminSidebar isOpen={true} />
        <main className="ml-64 w-[calc(100%-256px)]">{children}</main>
      </div>
    </RoleGuard>
  )
}
