import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") ?? "20")
  const offset = parseInt(searchParams.get("offset") ?? "0")
  const q = searchParams.get("q") ?? ""

  const supabase = await createClient()

  let query = supabase
    .from("events")
    .select(
      `
      *,
      ticket_types (
        id, name, price, capacity, available
      ),
      profiles!organizer_id (
        full_name, email
      )
    `
    )
    .eq("status", "approved")
    .order("start_date", { ascending: true })
    .range(offset, offset + limit - 1)

  if (q) {
    query = query.ilike("title", `%${q}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: data, total: count })
}
