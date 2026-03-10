import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, Ticket } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { Event, TicketType } from "@/types/database"

interface EventCardProps {
  event: Event & { ticket_types?: TicketType[] }
}

export default function EventCard({ event }: EventCardProps) {
  const minPrice = event.ticket_types?.length
    ? Math.min(...event.ticket_types.map((t) => t.price))
    : null

  const hasAvailability = event.ticket_types?.some((t) => t.available > 0) ?? true

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-[var(--primary-border)] hover:shadow-lg hover:border-[var(--success)] transition-all duration-200"
    >
      {/* Cover Image */}
      <div className="relative h-48 bg-[var(--primary-light)] overflow-hidden">
        {event.cover_image ? (
          <Image
            src={event.cover_image}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ticket className="w-12 h-12 text-[var(--success)] opacity-40" />
          </div>
        )}

        {/* Status badge */}
        {!hasAvailability && (
          <div className="absolute top-3 left-3">
            <span className="bg-gray-900/75 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              Agotado
            </span>
          </div>
        )}

        {/* Eco badge */}
        <div className="absolute top-3 right-3">
          <span className="badge-eco">🌿 Eco</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[var(--text)] text-base leading-snug line-clamp-2 group-hover:text-[var(--primary)] transition-colors mb-3">
          {event.title}
        </h3>

        <div className="space-y-1.5 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-[var(--success)]" />
            <span>{formatDate(event.start_date)}</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[var(--success)]" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mt-4 flex items-center justify-between">
          {minPrice !== null ? (
            <div>
              <span className="text-xs text-[var(--muted)]">Desde</span>
              <p className="font-bold text-[var(--primary)] text-lg leading-none mt-0.5">
                {formatCurrency(minPrice)}
              </p>
            </div>
          ) : (
            <span className="text-sm text-[var(--muted)]">Ver precios</span>
          )}

          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              hasAvailability
                ? "bg-[var(--primary-badge)] text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {hasAvailability ? "Comprar" : "Agotado"}
          </span>
        </div>
      </div>
    </Link>
  )
}
