import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const supabase = await createClient()
    const { status } = await request.json()

    // Verify user is authenticated and owns the restaurant
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the order and verify ownership
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        restaurants!inner (owner_id)
      `)
      .eq("id", params.orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.restaurants.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === "ready" && { estimated_ready_time: new Date().toISOString() }),
      })
      .eq("id", params.orderId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
