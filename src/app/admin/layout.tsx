import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirect=/admin")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/")

  return (
    <div className="flex min-h-screen bg-[var(--surface)]">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6">{children}</main>
    </div>
  )
}
