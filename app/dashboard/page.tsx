import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UtensilsCrossed, ShoppingBag, TrendingUp, Users, Plus, QrCode, Settings } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user's restaurant
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Loading...</div>
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, owner_id")
    .eq("owner_id", user.id)
    .single()

  if (!restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to TableTap!</h1>
          <p className="text-gray-600 mt-2">Let's set up your restaurant to get started.</p>
        </div>
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Complete Your Setup</CardTitle>
            <CardDescription className="text-orange-700">
              Set up your restaurant profile to start receiving orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link href="/dashboard/settings">
                <Plus className="mr-2 h-4 w-4" />
                Set Up Restaurant
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [{ count: menuItemsCount }, { count: ordersCount }, { count: todayOrdersCount }, { data: recentOrders }] =
    await Promise.all([
      supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurant.id),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurant.id),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id)
        .gte("created_at", new Date().toISOString().split("T")[0]),
      supabase
        .from("orders")
        .select(`
        id,
        total_amount,
        status,
        table_number,
        created_at,
        customers!inner (name, phone)
      `)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  const stats = [
    {
      title: "Menu Items",
      value: menuItemsCount || 0,
      description: "Active menu items",
      icon: UtensilsCrossed,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Orders",
      value: ordersCount || 0,
      description: "All time orders",
      icon: ShoppingBag,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Today's Orders",
      value: todayOrdersCount || 0,
      description: "Orders today",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Customers",
      value: "0", // We'll implement this later
      description: "Registered customers",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {restaurant.name}!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your restaurant today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from your customers</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        {order.customers?.name || "Guest"} • Table {order.table_number}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rs. {order.total_amount}</p>
                      <span className={`order-status-badge order-status-${order.status}`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No orders yet</p>
                <p className="text-sm">Orders will appear here once customers start ordering</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start bg-transparent" variant="outline">
              <Link href="/dashboard/menu" prefetch={true}>
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                Manage Menu
              </Link>
            </Button>
            <Button asChild className="w-full justify-start bg-transparent" variant="outline">
              <Link href="/dashboard/orders" prefetch={true}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                View Orders
              </Link>
            </Button>
            <Button asChild className="w-full justify-start bg-transparent" variant="outline">
              <Link href="/dashboard/qr-code" prefetch={true}>
                <QrCode className="mr-2 h-4 w-4" />
                Generate QR Code
              </Link>
            </Button>
            <Button asChild className="w-full justify-start bg-transparent" variant="outline">
              <Link href="/dashboard/settings" prefetch={true}>
                <Settings className="mr-2 h-4 w-4" />
                Restaurant Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
