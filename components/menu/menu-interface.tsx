"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MenuHeader } from "./menu-header"
import { MenuCategories } from "./menu-categories"
import { MenuItems } from "./menu-items"
import { CartSidebar } from "./cart-sidebar"
import { OrderModal } from "./order-modal"
import { CustomerOrderTracking } from "./customer-order-tracking"
import { ShoppingCart, Receipt } from "lucide-react"

interface Restaurant {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
}

interface Category {
  id: string
  name: string
  description: string | null
}

export interface MenuItem {
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
  // New nutrition fields
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fiber: number | null
  sugar: number | null
  sodium: number | null
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  special_instructions?: string
}

interface MenuInterfaceProps {
  restaurant: Restaurant
  categories: Category[]
  menuItems: MenuItem[]
  tableNumber: string
}

export function MenuInterface({ restaurant, categories, menuItems, tableNumber }: MenuInterfaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [showOrderTracking, setShowOrderTracking] = useState(false)
  const [customerPhone, setCustomerPhone] = useState<string>("")

  useEffect(() => {
    const savedPhone = localStorage.getItem(`customer_phone_${restaurant.id}`)
    if (savedPhone) {
      setCustomerPhone(savedPhone)
    }
  }, [restaurant.id])

  const addToCart = (item: MenuItem, quantity = 1, specialInstructions?: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id)
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + quantity,
                special_instructions: specialInstructions || cartItem.special_instructions,
              }
            : cartItem,
        )
      } else {
        return [
          ...prevCart,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity,
            special_instructions: specialInstructions,
          },
        ]
      }
    })
  }

  const updateCartItemFromMenu = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== itemId))
    } else {
      const menuItem = menuItems.find((item) => item.id === itemId)
      if (!menuItem) return

      setCart((prevCart) => {
        const existingItem = prevCart.find((cartItem) => cartItem.id === itemId)
        if (existingItem) {
          return prevCart.map((cartItem) =>
            cartItem.id === itemId ? { ...cartItem, quantity: newQuantity } : cartItem,
          )
        } else {
          // Add new item to cart
          return [
            ...prevCart,
            {
              id: menuItem.id,
              name: menuItem.name,
              price: menuItem.price,
              quantity: newQuantity,
            },
          ]
        }
      })
    }
  }

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const cartSummary = cart.map((item) => ({ id: item.id, quantity: item.quantity }))

  const filteredItems = selectedCategory ? menuItems.filter((item) => item.category_id === selectedCategory) : menuItems

  const handlePhoneChange = (phone: string) => {
    setCustomerPhone(phone)
    if (phone) {
      localStorage.setItem(`customer_phone_${restaurant.id}`, phone)
    } else {
      localStorage.removeItem(`customer_phone_${restaurant.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MenuHeader restaurant={restaurant} tableNumber={tableNumber} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div></div>
          <Button variant="outline" onClick={() => setShowOrderTracking(true)} className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>Track Orders</span>
          </Button>
        </div>

        {categories.length > 0 && (
          <MenuCategories
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            loading={false} // Pass loading prop
          />
        )}

        <MenuItems
          items={filteredItems}
          cart={cartSummary}
          onAddToCart={addToCart}
          onUpdateCart={updateCartItemFromMenu}
        />

        {cart.length > 0 && (
          <div className="fixed bottom-20 right-6 z-40">
            <Button
              onClick={() => setIsCartOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 rounded-full h-14 w-14 shadow-lg relative"
            >
              <ShoppingCart className="h-6 w-6" />
              <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white min-w-[1.5rem] h-6 rounded-full flex items-center justify-center text-xs">
                {getTotalItems()}
              </Badge>
            </Button>
          </div>
        )}

        {filteredItems.length === 0 && (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                <h3 className="text-lg font-medium mb-2">No items available</h3>
                <p className="text-sm">
                  {selectedCategory ? "No items in this category" : "The menu is currently being updated"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateItem={updateCartItemFromMenu}
        onRemoveItem={removeFromCart}
        totalAmount={getTotalAmount()}
        onCheckout={() => {
          setIsCartOpen(false)
          setIsOrderModalOpen(true)
        }}
      />

      <CustomerOrderTracking
        isOpen={showOrderTracking}
        onClose={() => setShowOrderTracking(false)}
        restaurantId={restaurant.id}
        customerPhone={customerPhone}
        onPhoneChange={handlePhoneChange}
      />

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        restaurant={restaurant}
        cart={cart}
        tableNumber={tableNumber}
        totalAmount={getTotalAmount()}
        onOrderComplete={(phone?: string) => {
          setCart([])
          setIsOrderModalOpen(false)
          if (phone) {
            handlePhoneChange(phone)
          }
        }}
      />
    </div>
  )
}
