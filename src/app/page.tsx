import NavBar from "@/components/layout/NavBar"
import EventCard from "@/components/events/EventCard"
import { createClient } from "@/lib/supabase/server"
import type { Event, TicketType } from "@/types/database"

export const revalidate = 60 // Revalidate every minute

async function getEvents() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select("*, ticket_types(id, name, price, capacity, available)")
    .eq("status", "approved")
    .order("start_date", { ascending: true })
    .limit(20)
  return data ?? []
}

export default async function HomePage() {
  const events = await getEvents()

  return (
    <div className="min-h-screen bg-[var(--primary-light)]">
      <NavBar />

      {/* Hero */}
      <section className="pt-24 pb-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="badge-eco text-sm inline-block mb-4">
            🌿 La boletera del movimiento eco-consciente
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--primary)] leading-tight mb-4">
            Vive experiencias<br className="hidden md:block" /> que transforman
          </h1>
          <p className="text-[var(--muted)] text-base md:text-lg max-w-xl mx-auto">
            Encuentra eventos, compra tus entradas y elige tu camp — todo en un solo lugar.
          </p>
        </div>
      </section>

      {/* Events grid */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--text)]">
              Próximos eventos
            </h2>
            <span className="text-sm text-[var(--muted)]">
              {events.length} evento{events.length !== 1 ? "s" : ""}
            </span>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event as Event & { ticket_types: TicketType[] }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-[var(--primary-badge)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌿</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
                Próximamente
              </h3>
              <p className="text-[var(--muted)] text-sm">
                Los eventos de la temporada se publicarán muy pronto.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--primary-border)] bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--muted)]">
            © {new Date().getFullYear()} EcoEventos · Urbánika
          </p>
          <div className="flex gap-6 text-sm text-[var(--muted)]">
            <a href="/terminos" className="hover:text-[var(--primary)]">Términos</a>
            <a href="/privacidad" className="hover:text-[var(--primary)]">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
