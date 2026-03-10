"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, Download, Tent } from "lucide-react"
import NavBar from "@/components/layout/NavBar"
import { createClient } from "@/lib/supabase/client"

interface Camp {
  id: string
  title: string
  description: string | null
  price: number
  available: number
  requires_payment: boolean
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("order_id")
  const eventSlug = searchParams.get("event_slug")

  const [camps, setCamps] = useState<Camp[]>([])
  const [hasCamps, setHasCamps] = useState(false)
  const [orderData, setOrderData] = useState<{ total: number } | null>(null)

  useEffect(() => {
    if (!orderId) {
      router.push("/")
      return
    }

    // Clear cart
    sessionStorage.removeItem("checkout_cart")

    // Check if event has camps requiring selection
    async function checkCamps() {
      if (!orderId) return

      const supabase = createClient()
      const { data: order } = await supabase
        .from("orders")
        .select("*, events(camps(*))")
        .eq("id", orderId)
        .single()

      if (!order) return
      setOrderData({ total: order.total })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eventCamps = (order as any).events?.camps as Camp[] | undefined
      if (eventCamps?.length) {
        setHasCamps(true)
        setCamps(eventCamps)
      }
    }

    checkCamps()
  }, [orderId, router])

  const handleSelectCamp = () => {
    router.push(`/checkout/camps?order_id=${orderId}&event_slug=${eventSlug}`)
  }

  return (
    <div className="min-h-screen bg-[var(--primary-light)]">
      <NavBar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          {/* Success card */}
          <div className="bg-white rounded-2xl border border-[var(--primary-border)] p-8 text-center">
            <div className="w-16 h-16 bg-[var(--primary-badge)] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[var(--primary)]" />
            </div>

            <h1 className="text-2xl font-bold text-[var(--text)] mb-2">
              ¡Compra exitosa!
            </h1>
            <p className="text-[var(--muted)] text-sm mb-6">
              Revisa tu correo — te enviamos el comprobante y tus entradas.
            </p>

            {orderData && (
              <div className="bg-[var(--primary-light)] rounded-xl px-4 py-3 mb-6">
                <p className="text-sm text-[var(--muted)]">Orden #{orderId?.slice(-8).toUpperCase()}</p>
              </div>
            )}

            {/* Camp CTA */}
            {hasCamps && camps.length > 0 && (
              <div className="bg-[var(--primary-badge)] rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <Tent className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[var(--primary)] text-sm">
                      ¡Elige tu camp!
                    </p>
                    <p className="text-xs text-[var(--primary)] opacity-80 mt-1">
                      Este evento incluye {camps.length} camp{camps.length > 1 ? "s" : ""}.
                      Selecciona el tuyo antes de que se agoten.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSelectCamp}
                  className="w-full mt-3 bg-[var(--primary)] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Seleccionar camp →
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/buyer/tickets")}
                className="flex items-center justify-center gap-2 border border-[var(--primary-border)] text-[var(--primary)] font-medium py-2.5 rounded-xl hover:bg-[var(--primary-light)] transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Ver mis tickets
              </button>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-[var(--muted)] hover:text-[var(--text)]"
              >
                Volver a eventos
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
