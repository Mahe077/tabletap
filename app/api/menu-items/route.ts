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
    const { name, description, price, category_id, restaurant_id, preparation_time, dietary_info, allergens } = body

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
    const { data: lastItem } = await supabase
      .from("menu_items")
      .select("display_order")
      .eq("restaurant_id", restaurant_id)
      .eq("category_id", category_id)
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (lastItem?.display_order || 0) + 1

    // Insert the new menu item
    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        restaurant_id,
        category_id,
        name,
        description,
        price: Number.parseFloat(price),
        preparation_time: preparation_time ? Number.parseInt(preparation_time) : null,
        dietary_info: dietary_info || [],
        allergens: allergens || [],
        display_order: nextOrder,
        is_available: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
