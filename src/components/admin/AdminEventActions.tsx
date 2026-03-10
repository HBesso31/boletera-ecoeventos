"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AdminEventActionsProps {
  eventId: string
  currentStatus: string
}

export default function AdminEventActions({
  eventId,
  currentStatus,
}: AdminEventActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const updateStatus = async (newStatus: "approved" | "rejected") => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.from("events").update({ status: newStatus }).eq("id", eventId)
    router.refresh()
    setIsLoading(false)
  }

  if (currentStatus === "approved") {
    return (
      <button
        onClick={() => updateStatus("rejected")}
        disabled={isLoading}
        className="text-xs text-red-500 hover:underline disabled:opacity-50"
      >
        Rechazar
      </button>
    )
  }

  if (currentStatus === "rejected") {
    return (
      <button
        onClick={() => updateStatus("approved")}
        disabled={isLoading}
        className="text-xs text-green-600 hover:underline disabled:opacity-50"
      >
        Re-aprobar
      </button>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => updateStatus("approved")}
        disabled={isLoading}
        className="flex items-center gap-1 text-xs font-medium text-green-600 hover:bg-green-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        Aprobar
      </button>
      <button
        onClick={() => updateStatus("rejected")}
        disabled={isLoading}
        className="flex items-center gap-1 text-xs font-medium text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <XCircle className="w-3.5 h-3.5" />
        Rechazar
      </button>
    </div>
  )
}
