import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, restaurant_id } = body

    // Verify the user owns this restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("id", restaurant_id)
      .eq("owner_id", user.id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: "Restaurant not found or unauthorized" }, { status: 404 })
    }

    // Get the next display order
    const { data: lastCategory } = await supabase
      .from("menu_categories")
      .select("display_order")
      .eq("restaurant_id", restaurant_id)
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (lastCategory?.display_order || 0) + 1

    // Insert the new category
    const { data, error } = await supabase
      .from("menu_categories")
      .insert({
        restaurant_id,
        name,
        description,
        display_order: nextOrder,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
