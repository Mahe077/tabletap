import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { MenuInterface } from "@/components/menu/menu-interface"

interface MenuPageProps {
  params: {
    restaurantId: string
  }
  searchParams: {
    table?: string
  }
}

export default async function MenuPage({ params, searchParams }: MenuPageProps) {
  const supabase = await createClient()

  // Get restaurant details
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", params.restaurantId)
    .eq("is_active", true)
    .single()

  if (restaurantError || !restaurant) {
    notFound()
  }

  // Get menu categories
  const { data: categories } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("restaurant_id", params.restaurantId)
    .eq("is_active", true)
    .order("display_order")

  // Get menu items
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select(`
      *,
      menu_categories (name)
    `)
    .eq("restaurant_id", params.restaurantId)
    .eq("is_available", true)
    .order("display_order")

  return (
    <MenuInterface
      restaurant={restaurant}
      categories={categories || []}
      menuItems={menuItems || []}
      tableNumber={searchParams.table ? searchParams.table : "1"}
    />
  )
}
