
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Award, Users } from "lucide-react";

export async function CustomerStats({ restaurantId }: { restaurantId: string }) {
  const supabase = await createClient();

  const { count: totalCustomers } = await supabase.from("customers").select("*", { count: "exact", head: true });

  const { data: loyaltyStats } = await supabase
    .from("customers")
    .select("loyalty_points, total_orders")
    .gt("total_orders", 0);

  const { data: topCustomers } = await supabase
    .from("customers")
    .select("name, phone, loyalty_points, total_orders")
    .gt("total_orders", 0)
    .order("total_orders", { ascending: false })
    .limit(5);

  const totalLoyaltyPoints = loyaltyStats?.reduce((sum, customer) => sum + customer.loyalty_points, 0) || 0;
  const avgOrdersPerCustomer = loyaltyStats?.length
    ? loyaltyStats.reduce((sum, customer) => sum + customer.total_orders, 0) / loyaltyStats.length
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
  );
}
