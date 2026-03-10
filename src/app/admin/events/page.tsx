import { createClient } from "@/lib/supabase/server"
import AdminEventActions from "@/components/admin/AdminEventActions"
import { formatDate } from "@/lib/utils"
import { CheckCircle, XCircle, Clock } from "lucide-react"

const statusConfig = {
  pending: { label: "Pendiente", icon: Clock, color: "text-amber-600 bg-amber-50" },
  approved: { label: "Aprobado", icon: CheckCircle, color: "text-green-600 bg-green-50" },
  rejected: { label: "Rechazado", icon: XCircle, color: "text-red-600 bg-red-50" },
  draft: { label: "Borrador", icon: Clock, color: "text-gray-500 bg-gray-50" },
}

async function getEvents() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select("*, profiles!organizer_id(full_name, email)")
    .order("created_at", { ascending: false })
  return data ?? []
}

export default async function AdminEventsPage() {
  const events = await getEvents()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Eventos</h1>

      <div className="bg-white rounded-2xl border border-[var(--primary-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--primary-border)] bg-[var(--primary-light)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--text)]">Evento</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text)]">Organizador</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text)]">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text)]">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text)]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--primary-border)]">
              {events.map((event) => {
                const status = statusConfig[event.status as keyof typeof statusConfig] ?? statusConfig.draft
                const StatusIcon = status.icon
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const organizer = (event as any).profiles

                return (
                  <tr key={event.id} className="hover:bg-[var(--primary-light)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text)] truncate max-w-[200px]">
                        {event.title}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{event.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {organizer?.full_name ?? organizer?.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {formatDate(event.start_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AdminEventActions eventId={event.id} currentStatus={event.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {events.length === 0 && (
            <div className="text-center py-12 text-[var(--muted)] text-sm">
              No hay eventos aún.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
