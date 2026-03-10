"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Event, TicketType } from "@/types/database"

interface TicketSelectorProps {
  event: Event
  ticketTypes: TicketType[]
}

export default function TicketSelector({ event, ticketTypes }: TicketSelectorProps) {
  const router = useRouter()
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(ticketTypes.map((t) => [t.id, 0]))
  )

  const updateQuantity = (id: string, delta: number) => {
    const tt = ticketTypes.find((t) => t.id === id)
    if (!tt) return
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(tt.available, (prev[id] ?? 0) + delta)),
    }))
  }

  const total = ticketTypes.reduce(
    (sum, tt) => sum + tt.price * (quantities[tt.id] ?? 0),
    0
  )

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0)

  const handleCheckout = () => {
    const items = ticketTypes
      .filter((tt) => (quantities[tt.id] ?? 0) > 0)
      .map((tt) => ({
        ticket_type_id: tt.id,
        quantity: quantities[tt.id],
        name: tt.name,
        price: tt.price,
      }))

    // Store cart in sessionStorage
    sessionStorage.setItem(
      "checkout_cart",
      JSON.stringify({ event_id: event.id, event_slug: event.slug, items, total })
    )
    router.push(`/checkout/${event.slug}`)
  }

  if (ticketTypes.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-[var(--primary-border)] text-center">
        <p className="text-[var(--muted)] text-sm">
          No hay entradas disponibles en este momento.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[var(--primary-border)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--primary)] px-5 py-4">
        <h3 className="font-semibold text-white">Selecciona tus entradas</h3>
      </div>

      {/* Ticket types */}
      <div className="divide-y divide-[var(--primary-border)]">
        {ticketTypes.map((tt) => (
          <div key={tt.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-[var(--text)] text-sm">{tt.name}</p>
                <p className="font-bold text-[var(--primary)] mt-1">
                  {formatCurrency(tt.price)}
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {tt.available > 0 ? `${tt.available} disponibles` : "Agotado"}
                </p>
              </div>

              {/* Quantity control */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(tt.id, -1)}
                  disabled={quantities[tt.id] === 0}
                  className="w-8 h-8 rounded-full border border-[var(--primary-border)] flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary-light)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-semibold text-[var(--text)] text-sm">
                  {quantities[tt.id] ?? 0}
                </span>
                <button
                  onClick={() => updateQuantity(tt.id, 1)}
                  disabled={tt.available === 0 || quantities[tt.id] >= tt.available}
                  className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white hover:bg-[var(--primary-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total + CTA */}
      <div className="px-5 py-4 bg-[var(--primary-light)] border-t border-[var(--primary-border)]">
        {totalItems > 0 && (
          <div className="flex justify-between mb-3">
            <span className="text-sm text-[var(--muted)]">
              Total ({totalItems} entrada{totalItems > 1 ? "s" : ""})
            </span>
            <span className="font-bold text-[var(--text)]">
              {formatCurrency(total)}
            </span>
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={totalItems === 0}
          className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-white font-semibold py-3 rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          {totalItems === 0 ? "Selecciona entradas" : "Continuar con la compra"}
        </button>
      </div>
    </div>
  )
}
