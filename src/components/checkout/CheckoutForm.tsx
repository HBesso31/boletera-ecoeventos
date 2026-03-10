"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { formatCurrency } from "@/lib/utils"
import { ShieldCheck, CreditCard, Bitcoin, Lock } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  ticket_type_id: string
  quantity: number
  name: string
  price: number
}

interface Cart {
  event_id: string
  event_slug: string
  items: CartItem[]
  total: number
}

// Inner form (needs to be inside Elements)
function PaymentForm({
  cart,
  clientSecret,
  orderId,
}: {
  cart: Cart
  clientSecret: string
  orderId: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [contact, setContact] = useState({ name: "", email: "", phone: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    if (!contact.name || !contact.email) {
      setError("Por favor completa tu nombre y correo.")
      return
    }

    setIsLoading(true)
    setError("")

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order_id=${orderId}&event_slug=${cart.event_slug}`,
        receipt_email: contact.email,
        payment_method_data: {
          billing_details: { name: contact.name, email: contact.email },
        },
      },
    })

    if (stripeError) {
      setError(stripeError.message ?? "Error al procesar el pago.")
      setIsLoading(false)
    }
    // If no error, Stripe redirects to return_url
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact + Payment */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contact info */}
          <div className="bg-white rounded-2xl border border-[var(--primary-border)] p-5">
            <h2 className="font-semibold text-[var(--text)] mb-4">
              Datos de contacto
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  placeholder="Tu nombre"
                  className="w-full border border-[var(--primary-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  placeholder="tu@correo.com"
                  className="w-full border border-[var(--primary-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  placeholder="+52 55 0000 0000"
                  className="w-full border border-[var(--primary-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payment method selector */}
          <div className="bg-white rounded-2xl border border-[var(--primary-border)] p-5">
            <h2 className="font-semibold text-[var(--text)] mb-4">
              Método de pago
            </h2>

            {/* Method tabs */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  paymentMethod === "card"
                    ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Tarjeta
              </button>

              {/* Crypto — Coming Soon */}
              <div className="flex-1 relative">
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--muted-light)] cursor-not-allowed"
                >
                  <Bitcoin className="w-4 h-4" />
                  Cripto
                </button>
                <span className="absolute -top-2 -right-1 badge-coming-soon">
                  Próximamente
                </span>
              </div>
            </div>

            {/* Stripe Elements */}
            <PaymentElement
              options={{
                layout: "accordion",
                defaultValues: {
                  billingDetails: { email: contact.email, name: contact.name },
                },
              }}
            />

            {error && (
              <p className="text-red-500 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] px-1">
            <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
            <span>Pago 100% seguro · Procesado por Stripe · Datos encriptados</span>
          </div>
        </div>

        {/* Right: Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[var(--primary-border)] p-5 sticky top-24">
            <h2 className="font-semibold text-[var(--text)] mb-4">
              Resumen del pedido
            </h2>

            <div className="divide-y divide-[var(--primary-border)]">
              {cart.items.map((item) => (
                <div key={item.ticket_type_id} className="py-3 flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[var(--muted)]">× {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--primary-border)] mt-3 pt-3 flex justify-between">
              <span className="font-bold text-[var(--text)]">Total</span>
              <span className="font-bold text-[var(--primary)] text-lg">
                {formatCurrency(cart.total)}
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !stripe}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-[var(--primary)] text-white font-semibold py-3.5 rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Lock className="w-4 h-4" />
              {isLoading ? "Procesando..." : `Pagar ${formatCurrency(cart.total)}`}
            </button>

            <p className="text-xs text-center text-[var(--muted)] mt-3">
              Al pagar aceptas nuestros{" "}
              <a href="/terminos" className="text-[var(--primary)] hover:underline">
                Términos y Condiciones
              </a>
            </p>
          </div>
        </div>
      </div>
    </form>
  )
}

// Wrapper: fetches client_secret, then renders Elements + PaymentForm
export default function CheckoutForm({ eventSlug }: { eventSlug: string }) {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [clientSecret, setClientSecret] = useState("")
  const [orderId, setOrderId] = useState("")
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState("")

  useEffect(() => {
    const stored = sessionStorage.getItem("checkout_cart")
    if (!stored) {
      router.push(`/events/${eventSlug}`)
      return
    }

    const parsedCart: Cart = JSON.parse(stored)
    setCart(parsedCart)

    // Create PaymentIntent
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: parsedCart.event_id,
        items: parsedCart.items,
        contact: { name: "", email: "" }, // will be filled in form
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setClientSecret(data.client_secret)
        setOrderId(data.order_id)
      })
      .catch((err) => {
        setInitError(err.message ?? "Error al iniciar el pago")
      })
      .finally(() => setIsInitializing(false))
  }, [eventSlug, router])

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[var(--muted)] text-sm">Preparando tu orden...</p>
        </div>
      </div>
    )
  }

  if (initError || !cart || !clientSecret) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{initError || "Error al cargar el checkout."}</p>
        <button
          onClick={() => router.push(`/events/${eventSlug}`)}
          className="text-[var(--primary)] text-sm hover:underline"
        >
          ← Volver al evento
        </button>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#1b6b3a",
            colorBackground: "#ffffff",
            colorText: "#262626",
            fontFamily: "Poppins, system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
        locale: "es",
      }}
    >
      <PaymentForm cart={cart} clientSecret={clientSecret} orderId={orderId} />
    </Elements>
  )
}
