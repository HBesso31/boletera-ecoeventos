"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, Ticket, LogOut, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function NavBar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)

    return () => {
      listener.subscription.unsubscribe()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-white shadow-sm border-b border-[var(--primary-border)]"
          : "bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center group-hover:bg-[var(--primary-hover)] transition-colors">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[var(--primary)] text-lg tracking-tight">
              EcoEventos
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Eventos
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/buyer/tickets"
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith("/buyer")
                      ? "text-[var(--primary)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  Mis tickets
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-[var(--primary)] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                <User className="w-4 h-4" />
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--primary-light)]"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-[var(--primary-border)] bg-white">
          <div className="px-4 py-3 space-y-3">
            <Link
              href="/"
              className="block text-sm font-medium text-[var(--text)] py-2"
              onClick={() => setIsOpen(false)}
            >
              Eventos
            </Link>
            {user ? (
              <>
                <Link
                  href="/buyer/tickets"
                  className="block text-sm font-medium text-[var(--text)] py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Mis tickets
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block text-sm text-[var(--muted)] py-2"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block text-sm font-semibold text-[var(--primary)] py-2"
                onClick={() => setIsOpen(false)}
              >
                Entrar / Registrarse
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
