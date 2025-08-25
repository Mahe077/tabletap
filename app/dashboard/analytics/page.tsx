import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Users, Star, Calendar, Award } from "lucide-react"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Get user's restaurant
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("owner_id", user?.id).single()

  if (!restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Restaurant Setup Required</CardTitle>
            <CardDescription className="text-orange-700">
              Please set up your restaurant profile first to view analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Get analytics data
  const today = new Date().toISOString().split("T")[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  // Revenue analytics
  const { data: todayRevenue } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", today)
    .eq("status", "completed")

  const { data: monthRevenue } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", thisMonth)
    .eq("status", "completed")

  const { data: allTimeRevenue } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("restaurant_id", restaurant.id)
    .eq("status", "completed")

  // Customer analytics
  const { count: totalCustomers } = await supabase.from("customers").select("*", { count: "exact", head: true })

  const { data: loyaltyStats } = await supabase
    .from("customers")
    .select("loyalty_points, total_orders")
    .gt("total_orders", 0)

  const { data: topCustomers } = await supabase
    .from("customers")
    .select("name, phone, loyalty_points, total_orders")
    .gt("total_orders", 0)
    .order("total_orders", { ascending: false })
    .limit(5)

  // Order analytics
  const { count: todayOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", today)

  const { count: monthOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", thisMonth)

  // Popular items
  const { data: popularItems } = await supabase
    .from("order_items")
    .select(`
      quantity,
      menu_items (name, price)
    `)
    .eq("menu_items.restaurant_id", restaurant.id)
    .limit(100)

  // Calculate totals
  const todayTotal = todayRevenue?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
  const monthTotal = monthRevenue?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
  const allTimeTotal = allTimeRevenue?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

  const totalLoyaltyPoints = loyaltyStats?.reduce((sum, customer) => sum + customer.loyalty_points, 0) || 0
  const avgOrdersPerCustomer = loyaltyStats?.length
    ? loyaltyStats.reduce((sum, customer) => sum + customer.total_orders, 0) / loyaltyStats.length
    : 0

  // Group popular items
  const itemCounts = popularItems?.reduce(
    (acc: Record<string, { name: string; count: number; price: number }>, item) => {
      if (item.menu_items) {
        const name = item.menu_items.name
        if (!acc[name]) {
          acc[name] = { name, count: 0, price: item.menu_items.price }
        }
        acc[name].count += item.quantity
      }
      return acc
    },
    {},
  )

  const topItems = Object.values(itemCounts || {})
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-2">Track your restaurant's performance and customer loyalty</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-3xl font-bold text-gray-900">Rs. {todayTotal.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{todayOrders || 0} orders</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900">Rs. {monthTotal.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{monthOrders || 0} orders</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">All Time Revenue</p>
                <p className="text-3xl font-bold text-gray-900">Rs. {allTimeTotal.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Total earnings</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Customer Loyalty Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Loyalty Program</span>
            </CardTitle>
            <CardDescription>Customer loyalty and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-800">{totalCustomers || 0}</p>
                <p className="text-sm text-yellow-600">Total Customers</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-800">{totalLoyaltyPoints}</p>
                <p className="text-sm text-yellow-600">Points Distributed</p>
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-800">{avgOrdersPerCustomer.toFixed(1)}</p>
              <p className="text-sm text-blue-600">Avg Orders per Customer</p>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-500" />
              <span>Top Customers</span>
            </CardTitle>
            <CardDescription>Your most loyal customers</CardDescription>
          </CardHeader>
          <CardContent>
            {topCustomers && topCustomers.length > 0 ? (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div
                    key={customer.phone || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{customer.name || "Guest"}</p>
                      <p className="text-sm text-gray-600">{customer.phone || "No phone"}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {customer.total_orders} orders
                      </Badge>
                      <p className="text-xs text-yellow-600">{customer.loyalty_points} points</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No customer data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Items */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Menu Items</CardTitle>
          <CardDescription>Your best-selling items</CardDescription>
        </CardHeader>
        <CardContent>
          {topItems.length > 0 ? (
            <div className="space-y-4">
              {topItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Rs. {item.price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{item.count} sold</p>
                    <p className="text-sm text-gray-600">Rs. {(item.count * item.price).toFixed(2)} revenue</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No sales data yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
