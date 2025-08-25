import { createClient } from "@/lib/supabase/server"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RealTimeOrders } from "@/components/dashboard/real-time-orders"

export default async function OrdersPage() {
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
              Please set up your restaurant profile first to view orders.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-2">Track and manage all incoming orders in real-time</p>
      </div>

      <RealTimeOrders restaurant={restaurant} />
    </div>
  )
}
