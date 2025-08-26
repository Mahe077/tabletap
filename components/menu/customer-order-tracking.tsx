"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Clock, CheckCircle, ChefHat, Package, Download, Printer } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Order {
  id: string
  table_number: string
  status: string
  total_amount: number
  loyalty_points_earned: number
  loyalty_points_used: number
  created_at: string
  order_items: {
    quantity: number
    unit_price: number
    menu_items: {
      name: string
    }
  }[]
}

interface CustomerOrderTrackingProps {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  customerPhone: string
  onPhoneChange: (phone: string) => void
}

export function CustomerOrderTracking({
  isOpen,
  onClose,
  restaurantId,
  customerPhone,
  onPhoneChange,
}: CustomerOrderTrackingProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchOrders = async () => {
    if (!customerPhone || customerPhone.length < 10) return

    setLoading(true)
    setError(null)

    try {
      // First get customer ID for real-time subscription and potential error messages
      const { data: customer, error: customerError } = await supabase.from("customers").select("id").eq("phone", customerPhone).single()

      if (customerError || !customer) {
        setError("No orders found for this phone number or customer not found.")
        setOrders([])
        return
      }

      // Set the customer phone in the session for RLS
      await supabase.rpc('set_config', { key: 'request.customer_phone', value: customerPhone });

      // Get orders with items (RLS will filter by customer_id)
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          table_number,
          status,
          total_amount,
          loyalty_points_earned,
          loyalty_points_used,
          created_at,
          order_items (
            quantity,
            unit_price,
            menu_items (
              name
            )
          )
        `
        )
        .eq("restaurant_id", restaurantId) // Keep restaurant_id filter
        .order("created_at", { ascending: false })
        .limit(10)

      if (ordersError) throw ordersError

      setOrders(
        (ordersData || []).map((order: any) => ({
          ...order,
          order_items: (order.order_items || []).map((item: any) => ({
            ...item,
            menu_items: Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items,
          })),
        }))
      )

      // Set up real-time subscription for order status updates using customer.id
      const subscription = supabase
        .channel(`customer_orders_${customer.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `customer_id=eq.${customer.id}`,
          },
          (payload) => {
            setOrders((prevOrders) =>
              prevOrders.map((order) =>
                order.id === payload.new.id ? { ...order, status: payload.new.status } : order,
              ),
            )
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError("Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && customerPhone) {
      fetchOrders()
    }
  }, [isOpen, customerPhone])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-orange-100 text-orange-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "preparing":
        return <ChefHat className="h-4 w-4" />
      case "ready":
        return <Package className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const downloadReceipt = (order: Order) => {
    const receiptContent = `
RECEIPT - Order #${order.id.slice(0, 8)}
Table: ${order.table_number}
Date: ${new Date(order.created_at).toLocaleString()}

ITEMS:
${order.order_items
  .map((item) => `${item.quantity}x ${item.menu_items.name} - Rs. ${(item.unit_price * item.quantity).toFixed(2)}`)
  .join("\n")}

${order.loyalty_points_used > 0 ? `Points Used: ${order.loyalty_points_used} (-Rs. ${order.loyalty_points_used * 10})` : ""}
Total: Rs. ${order.total_amount.toFixed(2)}
${order.loyalty_points_earned > 0 ? `Points Earned: ${order.loyalty_points_earned}` : ""}

Thank you for your order!
    `.trim()

    const blob = new Blob([receiptContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${order.id.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const printReceipt = (order: Order) => {
    const receiptContent = `
      <div style="font-family: monospace; max-width: 300px; margin: 0 auto;">
        <h2 style="text-align: center;">RECEIPT</h2>
        <p><strong>Order #${order.id.slice(0, 8)}</strong></p>
        <p>Table: ${order.table_number}</p>
        <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
        <hr>
        <h3>ITEMS:</h3>
        ${order.order_items
          .map(
            (item) =>
              `<p>${item.quantity}x ${item.menu_items.name}<br>Rs. ${(item.unit_price * item.quantity).toFixed(2)}</p>`,
          )
          .join("")}
        <hr>
        ${order.loyalty_points_used > 0 ? `<p>Points Used: ${order.loyalty_points_used} (-Rs. ${order.loyalty_points_used * 10})</p>` : ""}
        <p><strong>Total: Rs. ${order.total_amount.toFixed(2)}</strong></p>
        ${order.loyalty_points_earned > 0 ? `<p>Points Earned: ${order.loyalty_points_earned}</p>` : ""}
        <hr>
        <p style="text-align: center;">Thank you for your order!</p>
      </div>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(
        `
        <html>
          <head><title>Receipt</title></head>
          <body onload="window.print(); window.close();">
            ${receiptContent}
          </body>
        </html>
      `,
      )
      printWindow.document.close()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Track Your Orders</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="+94 77 123 4567"
              />
              <Button onClick={fetchOrders} disabled={loading || !customerPhone}>
                {loading ? "Loading..." : "Find Orders"}
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <Tabs defaultValue="orders" className="w-full">
              <TabsList>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
              </TabsList>
              <TabsContent value="orders">
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-medium">Your Recent Orders</h3>
                    {orders.map((order) => (
                      <Card key={order.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-gray-600">
                                Table {order.table_number} • {new Date(order.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1`}>
                                {getStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 mb-3">
                            {order.order_items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>
                                  {item.quantity}x {item.menu_items.name}
                                </span>
                                <span>Rs. {(item.unit_price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t">
                            <div>
                              <p className="font-medium">Total: Rs. {order.total_amount.toFixed(2)}</p>
                              {order.loyalty_points_earned > 0 && (
                                <p className="text-sm text-green-600">+{order.loyalty_points_earned} points earned</p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => downloadReceipt(order)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => printReceipt(order)}>
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No orders found.</div>
                )}
              </TabsContent>
              <TabsContent value="loyalty">
                <div className="text-center text-gray-500 py-8">
                  {/* Placeholder for loyalty info, can be replaced with actual content */}
                  <p className="text-lg font-medium mb-2">Loyalty Points</p>
                  <p className="text-4xl font-bold text-green-600">
                    {orders.reduce((acc, order) => acc + (order.loyalty_points_earned || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Total points earned from your recent orders.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
