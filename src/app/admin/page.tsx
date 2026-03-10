import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, ShoppingBag, CalendarDays, Users } from "lucide-react"
import RevenueChart from "@/components/admin/RevenueChart"

async function getStats() {
  const supabase = await createClient()

  const [ordersRes, eventsRes, usersRes, pendingRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total, created_at")
      .eq("status", "paid"),
    supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("status", "approved"),
    supabase
      .from("profiles")
      .select("id", { count: "exact" }),
    supabase
      .from("events")
      .select("id, title, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const revenue = ordersRes.data?.reduce((sum, o) => sum + o.total, 0) ?? 0
  const totalOrders = ordersRes.data?.length ?? 0

  // Revenue by day for chart (last 30 days)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split("T")[0]
    const dayRevenue = ordersRes.data
      ?.filter((o) => o.created_at.startsWith(dateStr))
      .reduce((sum, o) => sum + o.total, 0) ?? 0
    return { date: dateStr, revenue: dayRevenue }
  })

  return {
    revenue,
    totalOrders,
    totalEvents: eventsRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
    pendingEvents: pendingRes.data ?? [],
    chartData,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const kpiCards = [
    {
      label: "Ingresos totales",
      value: formatCurrency(stats.revenue),
      icon: TrendingUp,
      color: "text-[var(--primary)]",
      bg: "bg-[var(--primary-badge)]",
    },
    {
      label: "Órdenes pagadas",
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Eventos activos",
      value: stats.totalEvents.toString(),
      icon: CalendarDays,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Usuarios registrados",
      value: stats.totalUsers.toString(),
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-[var(--primary-border)] p-5"
          >
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-[var(--text)]">{card.value}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-[var(--primary-border)] p-5 mb-6">
        <h2 className="font-semibold text-[var(--text)] mb-4">
          Ingresos últimos 30 días
        </h2>
        <RevenueChart data={stats.chartData} />
      </div>

      {/* Pending events */}
      {stats.pendingEvents.length > 0 && (
        <div className="bg-white rounded-2xl border border-orange-200 p-5">
          <h2 className="font-semibold text-[var(--text)] mb-4">
            Eventos pendientes de aprobación ({stats.pendingEvents.length})
          </h2>
          <div className="space-y-2">
            {stats.pendingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between py-2.5 border-b border-[var(--primary-border)] last:border-0"
              >
                <p className="text-sm font-medium text-[var(--text)]">{event.title}</p>
                <a
                  href={`/admin/events?id=${event.id}`}
                  className="text-xs text-[var(--primary)] hover:underline font-medium"
                >
                  Revisar →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
