import { notFound } from "next/navigation"
import Image from "next/image"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import NavBar from "@/components/layout/NavBar"
import TicketSelector from "@/components/events/TicketSelector"
import { formatDate, formatDateTime } from "@/lib/utils"
import { Calendar, MapPin, Clock, Ticket } from "lucide-react"
import type { Event, TicketType, Camp } from "@/types/database"

type EventWithDetails = Event & {
  ticket_types: TicketType[]
  camps: Camp[]
  profiles: { full_name: string | null; email: string | null } | null
}

async function getEvent(slug: string): Promise<EventWithDetails | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select(
      "*, ticket_types(*), camps(*), profiles!organizer_id(full_name, email)"
    )
    .eq("slug", slug)
    .eq("status", "approved")
    .single()

  return data as EventWithDetails | null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: "Evento no encontrado" }

  return {
    title: event.title,
    description: event.description ?? `Compra tus entradas para ${event.title}`,
    openGraph: {
      title: event.title,
      description: event.description ?? "",
      images: event.cover_image ? [event.cover_image] : [],
    },
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) notFound()

  return (
    <div className="min-h-screen bg-[var(--primary-light)]">
      <NavBar />

      <main className="pt-20 pb-16">
        {/* Cover image */}
        {event.cover_image && (
          <div className="relative h-56 md:h-80 w-full">
            <Image
              src={event.cover_image}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary-light)] via-transparent to-transparent" />
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Event info */}
            <div className="lg:col-span-2">
              {/* Badge + title */}
              <span className="badge-eco mb-3 inline-block">🌿 Eco Evento</span>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-4">
                {event.title}
              </h1>

              {/* Meta */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Calendar className="w-4 h-4 text-[var(--success)]" />
                  <span>{formatDateTime(event.start_date)}</span>
                </div>
                {event.end_date && (
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <Clock className="w-4 h-4 text-[var(--success)]" />
                    <span>Hasta el {formatDate(event.end_date)}</span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <MapPin className="w-4 h-4 text-[var(--success)]" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="prose prose-sm max-w-none">
                  <h2 className="text-lg font-semibold text-[var(--text)] mb-3">
                    Acerca del evento
                  </h2>
                  <p className="text-[var(--muted)] leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Camps info */}
              {event.camps?.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-[var(--text)] mb-3">
                    Camps disponibles
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {event.camps.map((camp) => (
                      <div
                        key={camp.id}
                        className="bg-white rounded-xl p-4 border border-[var(--primary-border)]"
                      >
                        <h3 className="font-semibold text-[var(--text)] text-sm">
                          {camp.title}
                        </h3>
                        {camp.description && (
                          <p className="text-xs text-[var(--muted)] mt-1">
                            {camp.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-[var(--muted)]">
                            {camp.available} lugares disponibles
                          </span>
                          {camp.price > 0 ? (
                            <span className="text-sm font-bold text-[var(--primary)]">
                              +${camp.price}
                            </span>
                          ) : (
                            <span className="badge-eco text-xs">Incluido</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-3">
                    * Selecciona tu camp en el proceso de compra de entradas.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Ticket selector (sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <TicketSelector event={event} ticketTypes={event.ticket_types} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
