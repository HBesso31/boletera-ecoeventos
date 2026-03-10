import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NavBar from "@/components/layout/NavBar"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Ticket, Calendar, MapPin } from "lucide-react"

async function getMyTickets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("orders")
    .select(`
      *,
      events (
        title, slug, start_date, location, cover_image
      ),
      order_items (
        quantity, unit_price,
        ticket_types ( name )
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })

  return data
}

export default async function MyTicketsPage() {
  const orders = await getMyTickets()

  if (orders === null) {
    redirect("/login?redirect=/buyer/tickets")
  }

  return (
    <div className="min-h-screen bg-[var(--primary-light)]">
      <NavBar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-[var(--text)] mb-6">
            Mis tickets
          </h1>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[var(--primary-border)]">
              <div className="w-14 h-14 bg-[var(--primary-badge)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-7 h-7 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text)] mb-2">
                Aún no tienes tickets
              </h3>
              <p className="text-sm text-[var(--muted)] mb-5">
                Cuando compres entradas, aparecerán aquí.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[var(--primary-hover)] transition-colors"
              >
                Ver eventos
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const event = (order as any).events
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const items = (order as any).order_items ?? []

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-[var(--primary-border)] overflow-hidden"
                  >
                    {/* Event header */}
                    <div className="bg-[var(--primary)] px-5 py-4">
                      <h3 className="font-semibold text-white text-base">
                        {event?.title ?? "Evento"}
                      </h3>
                      <div className="flex gap-4 mt-1">
                        {event?.start_date && (
                          <span className="text-xs text-white/80 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(event.start_date)}
                          </span>
                        )}
                        {event?.location && (
                          <span className="text-xs text-white/80 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ticket items */}
                    <div className="px-5 py-4">
                      {items.map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (item: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2.5 border-b border-[var(--primary-border)] last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium text-[var(--text)]">
                                {item.ticket_types?.name ?? "Entrada"}
                              </p>
                              <p className="text-xs text-[var(--muted)]">
                                × {item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-[var(--text)]">
                              {formatCurrency(item.unit_price * item.quantity)}
                            </p>
                          </div>
                        )
                      )}

                      {/* Order footer */}
                      <div className="flex items-center justify-between mt-3 pt-2">
                        <span className="text-xs text-[var(--muted)]">
                          Orden #{order.id.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-sm font-bold text-[var(--primary)]">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* QR placeholder */}
                    <div className="mx-5 mb-5 border border-dashed border-[var(--primary-border)] rounded-xl py-4 text-center">
                      <p className="text-xs text-[var(--muted)]">
                        QR ticket — disponible en el evento
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
