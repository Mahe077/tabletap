
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Calendar, TrendingUp } from "lucide-react";

export async function RevenueStats({ restaurantId }: { restaurantId: string }) {
  const supabase = await createClient();

  const { data: analytics } = await supabase.rpc('get_restaurant_analytics', { restaurant_id_param: restaurantId });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-3xl font-bold text-gray-900">Rs. {analytics.today_revenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{analytics.today_orders || 0} orders</p>
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
              <p className="text-3xl font-bold text-gray-900">Rs. {analytics.month_revenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{analytics.month_orders || 0} orders</p>
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
              <p className="text-3xl font-bold text-gray-900">Rs. {analytics.all_time_revenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Total earnings</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
