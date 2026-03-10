"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Users,
  Ticket,
  LogOut,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Eventos", icon: CalendarDays },
  { href: "/admin/payments", label: "Pagos", icon: CreditCard },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-[var(--primary-border)] hidden md:flex flex-col z-40">
      {/* Header */}
      <div className="px-5 py-5 border-b border-[var(--primary-border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[var(--primary)] rounded-lg flex items-center justify-center">
            <Ticket className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="font-bold text-[var(--primary)] text-sm leading-none">EcoEventos</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--primary-light)] text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[var(--primary-border)]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
