import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      ticket_types (
        id, name, price, capacity, available
      ),
      camps (
        id, title, description, price, capacity, available, requires_payment
      ),
      profiles!organizer_id (
        full_name, email
      )
    `
    )
    .eq("slug", slug)
    .eq("status", "approved")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  return NextResponse.json({ event: data })
}
