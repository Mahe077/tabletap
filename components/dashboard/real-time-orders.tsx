"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Clock, CheckCircle, XCircle, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Restaurant {
  id: string
  name: string
}

interface Order {
  id: string
  table_number: string
  status: string
  total_amount: number
  special_instructions: string | null
  created_at: string
  loyalty_points_earned: number
  customers: {
    name: string | null
    phone: string | null
  } | null
  order_items: {
    id: string
    quantity: number
    total_price: number
    menu_items: {
      name: string
      price: number
    } | null
  }[]
}

interface RealTimeOrdersProps {
  restaurant: Restaurant
}

export function RealTimeOrders({ restaurant }: RealTimeOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())

  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  const loadOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (name, phone),
          order_items (
            *,
            menu_items (name, price)
          )
        `)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error loading orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, restaurant.id, toast])

  useEffect(() => {
    loadOrders()
    const cleanup = setupRealtimeSubscription()
    return cleanup
  }, [loadOrders])

  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        async (payload) => {
          console.log("[v0] Real-time order update:", payload)

          if (payload.eventType === "INSERT") {
            // New order - play notification sound and show toast
            playNotificationSound()
            toast({
              title: "New Order!",
              description: `Order #${payload.new.id.slice(0, 8)} from Table ${payload.new.table_number}`,
              duration: 5000,
            })
            // Reload orders to get complete data with relations
            loadOrders()
          } else if (payload.eventType === "UPDATE") {
            try {
              const { data: updatedOrder, error } = await supabase
                .from("orders")
                .select(`
                  *,
                  customers (name, phone),
                  order_items (
                    *,
                    menu_items (name, price)
                  )
                `)
                .eq("id", payload.new.id)
                .single()

              if (error) throw error

              if (updatedOrder) {
                setOrders((prevOrders) =>
                  prevOrders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
                )
              }
            } catch (error) {
              console.error("Error fetching updated order:", error)
              // Fallback to reloading all orders
              loadOrders()
            }
          } else if (payload.eventType === "DELETE") {
            // Remove deleted order
            setOrders((prevOrders) => prevOrders.filter((order) => order.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, restaurant.id, loadOrders, toast])

  const playNotificationSound = () => {
    // Create a simple notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrders((prev) => new Set(prev).add(orderId))

    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
    )

    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      if (error) throw error

      toast({
        title: "Order Updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating order:", error)
      loadOrders()
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrders((prev) => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
      case "preparing":
        return <Clock className="h-4 w-4" />
      case "ready":
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-orange-100 text-orange-800"
      case "ready":
        return "bg-emerald-100 text-emerald-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getNextStatusAction = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return { status: "confirmed", label: "Confirm Order", color: "bg-blue-600 hover:bg-blue-700" }
      case "confirmed":
        return { status: "preparing", label: "Start Preparing", color: "bg-orange-600 hover:bg-orange-700" }
      case "preparing":
        return { status: "ready", label: "Mark Ready", color: "bg-emerald-600 hover:bg-emerald-700" }
      case "ready":
        return { status: "completed", label: "Complete Order", color: "bg-gray-600 hover:bg-gray-700" }
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const orderStats = [
    { label: "Pending", count: orders.filter((o) => o.status === "pending").length, color: "amber" },
    { label: "Preparing", count: orders.filter((o) => o.status === "preparing").length, color: "orange" },
    { label: "Ready", count: orders.filter((o) => o.status === "ready").length, color: "emerald" },
    { label: "Completed", count: orders.filter((o) => o.status === "completed").length, color: "gray" },
  ]

  return (
    <>
      {/* Real-time Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {orderStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.count}</p>
                </div>
                <div className="relative">
                  <ShoppingBag className={`h-6 w-6 text-${stat.color}-600`} />
                  {stat.label === "Pending" && stat.count > 0 && (
                    <Bell className="h-3 w-3 text-red-500 absolute -top-1 -right-1 animate-pulse" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Live Orders</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </CardTitle>
          <CardDescription>Orders update automatically as they come in</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => {
                const nextAction = getNextStatusAction(order.status)
                const isUpdating = updatingOrders.has(order.id)

                return (
                  <div
                    key={order.id}
                    className={`border rounded-lg p-6 hover:shadow-sm transition-all ${
                      order.status === "pending" ? "border-amber-300 bg-amber-50" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h3>
                          <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1`}>
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </Badge>
                          {order.status === "pending" && (
                            <Badge variant="outline" className="text-red-600 border-red-600 animate-pulse">
                              New!
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Customer: {order.customers?.name || "Guest"}</p>
                          <p>Table: {order.table_number}</p>
                          <p>Phone: {order.customers?.phone || "N/A"}</p>
                          <p>Time: {new Date(order.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">Rs. {order.total_amount}</p>
                        {order.loyalty_points_earned > 0 && (
                          <p className="text-sm text-green-600">+{order.loyalty_points_earned} points earned</p>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-2">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span>
                              {item.quantity}x {item.menu_items?.name}
                            </span>
                            <span>Rs. {item.total_price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.special_instructions && (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Special Instructions</h4>
                        <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md">
                          {order.special_instructions}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mt-4 pt-4 border-t">
                      {nextAction && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, nextAction.status)}
                          disabled={isUpdating}
                          className={nextAction.color}
                        >
                          {isUpdating ? "Updating..." : nextAction.label}
                        </Button>
                      )}
                      {order.status !== "cancelled" && order.status !== "completed" && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          disabled={isUpdating}
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                        >
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-sm">Orders from customers will appear here in real-time</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
