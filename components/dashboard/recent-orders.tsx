
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export async function RecentOrders({ restaurantId }: { restaurantId: string }) {
  const supabase = await createClient();

  const { data: recentOrders } = await supabase
    .from("orders")
    .select(`
      id,
      total_amount,
      status,
      table_number,
      created_at,
      customers!inner (name, phone)
    `)
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
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
  );
}
