import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

interface CartItem {
  ticket_type_id: string
  quantity: number
  unit_price: number
}

interface CheckoutBody {
  event_id: string
  items: CartItem[]
  contact: {
    name: string
    email: string
    phone?: string
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: CheckoutBody = await request.json()
  const { event_id, items, contact } = body

  if (!event_id || !items?.length || !contact?.email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Get event with Stripe account
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*, ticket_types(*)")
    .eq("id", event_id)
    .eq("status", "approved")
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Validate items and calculate total
  let total = 0
  const validatedItems: CartItem[] = []

  for (const item of items) {
    const ticketType = event.ticket_types?.find(
      (tt: { id: string }) => tt.id === item.ticket_type_id
    )
    if (!ticketType) {
      return NextResponse.json(
        { error: `Ticket type ${item.ticket_type_id} not found` },
        { status: 400 }
      )
    }
    if (ticketType.available < item.quantity) {
      return NextResponse.json(
        { error: `Not enough availability for ${ticketType.name}` },
        { status: 400 }
      )
    }
    const unitPrice = ticketType.price
    total += unitPrice * item.quantity
    validatedItems.push({ ticket_type_id: item.ticket_type_id, quantity: item.quantity, unit_price: unitPrice })
  }

  const totalCents = Math.round(total * 100)
  const applicationFeeCents = Math.round(totalCents * (event.application_fee_pct / 100))

  // Create order in DB (pending)
  const { data: order, error: orderError } = await serviceSupabase
    .from("orders")
    .insert({
      user_id: user.id,
      event_id,
      status: "pending",
      total,
    })
    .select()
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }

  // Insert order items
  const { error: itemsError } = await serviceSupabase.from("order_items").insert(
    validatedItems.map((item) => ({
      order_id: order.id,
      ticket_type_id: item.ticket_type_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  )

  if (itemsError) {
    return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
  }

  // Update profile contact info
  await serviceSupabase
    .from("profiles")
    .update({ full_name: contact.name, phone: contact.phone })
    .eq("id", user.id)

  // Create Stripe PaymentIntent
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: totalCents,
    currency: "mxn",
    metadata: {
      order_id: order.id,
      event_id,
      user_id: user.id,
    },
    receipt_email: contact.email,
  }

  // Use Stripe Connect if organizer has connected account
  if (event.stripe_account_id) {
    paymentIntentParams.on_behalf_of = event.stripe_account_id
    paymentIntentParams.application_fee_amount = applicationFeeCents
    paymentIntentParams.transfer_data = {
      destination: event.stripe_account_id,
    }
  }

  let paymentIntent: Stripe.PaymentIntent
  try {
    paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)
  } catch (stripeError) {
    // Rollback order
    await serviceSupabase.from("orders").delete().eq("id", order.id)
    console.error("Stripe error:", stripeError)
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
  }

  // Link PaymentIntent to order
  await serviceSupabase
    .from("orders")
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq("id", order.id)

  return NextResponse.json({
    client_secret: paymentIntent.client_secret,
    order_id: order.id,
    total,
  })
}
