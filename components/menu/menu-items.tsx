"use client"

import { MenuItem, MenuItemCard } from "./menu-item-card"

// interface MenuItem {
//   id: string
//   name: string
//   description: string | null
//   price: number
//   category_id: string | null
//   preparation_time: number | null
//   dietary_info: string[] | null
//   allergens: string[] | null
//   is_available: boolean
//   is_featured: boolean
//   image_url: string | null
//   calories: string;
//   protein: string;
//   carbs: string;
//   fat: string;
//   fiber: string;
//   sugar: string;
//   sodium: string;
//   menu_categories: { name: string } | null
// }

interface MenuItemsProps {
  items: MenuItem[]
  cart: { id: string; quantity: number }[]
  onAddToCart: (item: MenuItem, quantity?: number, specialInstructions?: string) => void
  onUpdateCart: (itemId: string, quantity: number) => void
}

export function MenuItems({ items, cart, onAddToCart, onUpdateCart }: MenuItemsProps) {
  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.find((item) => item.id === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => {
        const quantity = getCartQuantity(item.id)

        return (
          <MenuItemCard
            key={item.id}
            item={item}
            quantity={quantity}
            onAddToCart={onAddToCart}
            onUpdateCart={onUpdateCart}
          />
        )
      })}
    </div>
  )
}
