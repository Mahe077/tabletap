"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { X, CheckCircle, Gift, Star } from "lucide-react"

interface Restaurant {
  id: string
  name: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  special_instructions?: string
}

interface Customer {
  id: string
  name: string | null
  phone: string | null
  loyalty_points: number
  total_orders: number
}

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  restaurant: Restaurant
  cart: CartItem[]
  tableNumber: string
  totalAmount: number
  onOrderComplete: () => void
}

export function OrderModal({
  isOpen,
  onClose,
  restaurant,
  cart,
  tableNumber,
  totalAmount,
  onOrderComplete,
}: OrderModalProps) {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null)
  const [usePoints, setUsePoints] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [finalAmount, setFinalAmount] = useState(totalAmount)

  const supabase = createClient()

  useEffect(() => {
    // Calculate points earned (1 point per Rs. 100 spent)
    const earned = Math.floor(finalAmount / 100)
    setPointsEarned(earned)
  }, [finalAmount])

  useEffect(() => {
    // Recalculate final amount when points are used
    const discount = pointsToUse * 10 // Each point = Rs. 10 discount
    setFinalAmount(Math.max(0, totalAmount - discount))
  }, [pointsToUse, totalAmount])

  useEffect(() => {
    const checkExistingCustomer = async () => {
      if (customerPhone && customerPhone.length >= 10) {
        try {
          const { data, error } = await supabase.from("customers").select("*").eq("phone", customerPhone).single()

          if (!error && data) {
            setExistingCustomer(data)
            setCustomerName(data.name || "")
          } else {
            setExistingCustomer(null)
          }
        } catch (error) {
          // Customer doesn't exist, that's fine
          setExistingCustomer(null)
        }
      } else {
        setExistingCustomer(null)
        setUsePoints(false)
        setPointsToUse(0)
      }
    }

    checkExistingCustomer()
  }, [customerPhone])

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Create or update customer
      let customerId = null
      let updatedCustomer = null

      if (customerName || customerPhone) {
        if (existingCustomer) {
          // Update existing customer
          const newLoyaltyPoints = Math.max(0, existingCustomer.loyalty_points - pointsToUse + pointsEarned)
          const { data: customer, error: customerError } = await supabase
            .from("customers")
            .update({
              name: customerName || existingCustomer.name,
              loyalty_points: newLoyaltyPoints,
              total_orders: existingCustomer.total_orders + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingCustomer.id)
            .select()
            .single()

          if (customerError) throw customerError
          customerId = customer.id
          updatedCustomer = customer
        } else {
          // Create new customer
          const { data: customer, error: customerError } = await supabase
            .from("customers")
            .insert({
              name: customerName || null,
              phone: customerPhone || null,
              loyalty_points: pointsEarned,
              total_orders: 1,
            })
            .select()
            .single()

          if (customerError) throw customerError
          customerId = customer.id
          updatedCustomer = customer
        }
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurant.id,
          customer_id: customerId,
          table_number: tableNumber,
          status: "pending",
          total_amount: finalAmount,
          loyalty_points_earned: pointsEarned,
          loyalty_points_used: pointsToUse,
          special_instructions: specialInstructions || null,
        })
        .select('id')
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.special_instructions || null,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      setOrderId(order.id.slice(0, 8))
      setOrderPlaced(true)
    } catch (error) {
      console.error("Error placing order:", error)

      let errorMessage = "Failed to place order";
      let errorStack = undefined;
      let errorDetails: any = {};

      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
        errorDetails = { name: error.name, message: error.message, stack: error.stack };
      } else if (typeof error === 'object' && error !== null) {
        // Attempt to capture more details from Supabase errors or other objects
        errorMessage = (error as any).message || String(error);
        errorDetails = error;
      } else {
        errorMessage = String(error);
      }

      setError(errorMessage);

      // Send error to server-side logging endpoint
      try {
        await fetch('/api/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            level: 'error',
            message: errorMessage,
            error: errorDetails, // Send the full error object/details
            stack: errorStack, // Send the stack if available
            timestamp: new Date().toISOString(),
            // Add any other relevant context here
            cart: cart.map(item => ({ id: item.id, quantity: item.quantity, price: item.price })), // Sanitize cart for logging
            restaurantId: restaurant.id,
            tableNumber: tableNumber,
            customerPhone: customerPhone,
          }),
        });
      } catch (logError) {
        console.error('Failed to send error to logging endpoint:', logError);
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (orderPlaced) {
      onOrderComplete()
    }
    onClose()
    // Reset form
    setCustomerName("")
    setCustomerPhone("")
    setSpecialInstructions("")
    setOrderPlaced(false)
    setOrderId("")
    setError(null)
    setExistingCustomer(null)
    setUsePoints(false)
    setPointsToUse(0)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          {orderPlaced ? (
            // Order Success
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-green-800">Order Placed Successfully!</CardTitle>
                <CardDescription>Your order has been sent to the kitchen</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-medium text-green-800">Order #{orderId}</p>
                  <p className="text-sm text-green-700 mt-1">Table {tableNumber}</p>
                  <p className="text-sm text-green-700">Total: Rs. {finalAmount.toFixed(2)}</p>
                  {pointsEarned > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800 flex items-center justify-center">
                        <Star className="h-4 w-4 mr-1" />+{pointsEarned} loyalty points earned!
                      </p>
                    </div>
                  )}
                  {pointsToUse > 0 && (
                    <p className="text-sm text-green-700">
                      Points used: {pointsToUse} (Rs. {pointsToUse * 10} discount)
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Your order is being prepared. You'll be notified when it's ready for pickup.
                </p>
                <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700">
                  Continue
                </Button>
              </CardContent>
            </>
          ) : (
            // Order Form
            <>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Complete Your Order</CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <CardDescription>Please provide your details to place the order</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number (Optional)</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      required
                    />
                    {existingCustomer && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Star className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Welcome back!</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          You have {existingCustomer.loyalty_points} loyalty points
                        </p>
                        <p className="text-xs text-blue-600">Total orders: {existingCustomer.total_orders}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name (Optional)</Label>
                    <Input
                      id="customerName"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  {existingCustomer && existingCustomer.loyalty_points > 0 && (
                    <div className="space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="usePoints" className="flex items-center space-x-2">
                          <Gift className="h-4 w-4 text-yellow-600" />
                          <span>Use Loyalty Points</span>
                        </Label>
                        <Switch id="usePoints" checked={usePoints} onCheckedChange={setUsePoints} />
                      </div>
                      {usePoints && (
                        <div className="space-y-2">
                          <Label htmlFor="pointsToUse">Points to use (1 point = Rs. 10 discount)</Label>
                          <Input
                            id="pointsToUse"
                            type="number"
                            min="0"
                            max={Math.min(existingCustomer.loyalty_points, Math.floor(totalAmount / 10))}
                            value={pointsToUse}
                            onChange={(e) => setPointsToUse(Number(e.target.value))}
                          />
                          <p className="text-xs text-yellow-700">
                            Available: {existingCustomer.loyalty_points} points • Max usable:{" "}
                            {Math.min(existingCustomer.loyalty_points, Math.floor(totalAmount / 10))} points
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                    <Textarea
                      id="specialInstructions"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special requests or dietary requirements..."
                      rows={3}
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>Rs. {totalAmount.toFixed(2)}</span>
                        </div>
                        {pointsToUse > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Points discount ({pointsToUse} points)</span>
                            <span>-Rs. {(pointsToUse * 10).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium text-lg border-t pt-1">
                          <span>Total</span>
                          <span>Rs. {finalAmount.toFixed(2)}</span>
                        </div>
                        {pointsEarned > 0 && (
                          <div className="flex justify-between text-yellow-600 text-sm">
                            <span>Points to earn</span>
                            <span>+{pointsEarned} points</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                    {isSubmitting ? "Placing Order..." : `Place Order - Rs. ${finalAmount.toFixed(2)}`}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
