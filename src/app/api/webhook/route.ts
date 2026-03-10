import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Use direct client (not SSR) for webhook — no cookies
function getServiceSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent
      const orderId = pi.metadata.order_id

      if (!orderId) break

      // Update order status
      const { data: order } = await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("stripe_payment_intent_id", pi.id)
        .select("*, order_items(*, ticket_types(event_id))")
        .single()

      if (!order) break

      // Decrement ticket availability
      const { data: items } = await supabase
        .from("order_items")
        .select("ticket_type_id, quantity")
        .eq("order_id", orderId)

      if (items) {
        for (const item of items) {
          await supabase.rpc("decrement_ticket_availability", {
            p_ticket_type_id: item.ticket_type_id,
            p_quantity: item.quantity,
          })
        }
      }

      console.log(`✅ Order ${orderId} marked as paid`)
      break
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent

      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", pi.id)

      console.log(`❌ Payment failed for PI: ${pi.id}`)
      break
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge

      if (charge.payment_intent) {
        await supabase
          .from("orders")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent_id", charge.payment_intent as string)
      }
      break
    }

    default:
      console.log(`Unhandled webhook event: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

// Next.js App Router lee el body como stream — no necesita config adicional
