import { AdminSidebar } from '@/components/admin-sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <AdminSidebar isOpen={true} />
      <main className="ml-64 w-[calc(100%-256px)]">{children}</main>
    </div>
  )
}
