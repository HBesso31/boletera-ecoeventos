import NavBar from "@/components/layout/NavBar"
import CheckoutForm from "@/components/checkout/CheckoutForm"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Checkout" }

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="min-h-screen bg-[var(--primary-light)]">
      <NavBar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-[var(--text)] mb-6">
            Completa tu compra
          </h1>
          <CheckoutForm eventSlug={slug} />
        </div>
      </main>
    </div>
  )
}
