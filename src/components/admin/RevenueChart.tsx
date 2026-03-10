"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface DataPoint {
  date: string
  revenue: number
}

function formatAxisDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

export default function RevenueChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1b6b3a" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1b6b3a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ebf2ed" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatAxisDate}
          tick={{ fontSize: 11, fill: "#868e89" }}
          axisLine={false}
          tickLine={false}
          interval={6}
        />
        <YAxis
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "#868e89" }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), "Ingresos"]}
          labelFormatter={(label) => formatAxisDate(label)}
          contentStyle={{
            border: "1px solid #ebf2ed",
            borderRadius: "12px",
            fontSize: "12px",
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#1b6b3a"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#1b6b3a" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
