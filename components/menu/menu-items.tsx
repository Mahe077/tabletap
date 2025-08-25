"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Clock, Leaf, AlertTriangle } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category_id: string | null
  dietary_info: string[] | null
  allergens: string[] | null
  preparation_time: number | null
  menu_categories: { name: string } | null
}

interface MenuItemsProps {
  items: MenuItem[]
  cart: { id: string; quantity: number }[]
  onAddToCart: (item: MenuItem, quantity?: number, specialInstructions?: string) => void
  onUpdateCart: (itemId: string, quantity: number) => void
}

export function MenuItems({ items, cart, onAddToCart, onUpdateCart }: MenuItemsProps) {
  const getDietaryIcon = (info: string) => {
    switch (info.toLowerCase()) {
      case "vegetarian":
      case "vegan":
        return <Leaf className="h-3 w-3 text-green-600" />
      default:
        return null
    }
  }

  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.find((item) => item.id === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => {
        const quantity = getCartQuantity(item.id)

        return (
          <Card key={item.id} className="menu-item-card overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="relative">
                <div className="aspect-[4/3] w-full">
                  <img
                    src={item.image_url || "/placeholder.svg?height=240&width=320&query=delicious food dish"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Price overlay */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="font-bold text-gray-900">Rs. {item.price}</span>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.name}</h3>
                  {item.description && <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>}
                </div>

                {/* Dietary Info and Allergens */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.dietary_info?.map((info) => (
                    <Badge key={info} variant="outline" className="text-xs flex items-center space-x-1">
                      {getDietaryIcon(info)}
                      <span>{info}</span>
                    </Badge>
                  ))}
                  {item.allergens?.map((allergen) => (
                    <Badge
                      key={allergen}
                      variant="outline"
                      className="text-xs flex items-center space-x-1 text-red-600"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span>{allergen}</span>
                    </Badge>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {item.preparation_time && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{item.preparation_time}min</span>
                      </div>
                    )}
                  </div>

                  {quantity === 0 ? (
                    <Button onClick={() => onAddToCart(item)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateCart(item.id, quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Badge variant="secondary" className="px-3 py-1 font-medium">
                        {quantity}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateCart(item.id, quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
