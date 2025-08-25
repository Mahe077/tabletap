
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export async function PopularItems({ restaurantId }: { restaurantId: string }) {
  const supabase = await createClient();

  const { data: popularItems } = await supabase.rpc('get_popular_items', { restaurant_id_param: restaurantId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Menu Items</CardTitle>
        <CardDescription>Your best-selling items</CardDescription>
      </CardHeader>
      <CardContent>
        {popularItems && popularItems.length > 0 ? (
          <div className="space-y-4">
            {popularItems.map((item: any, index: number) => (
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
  );
}
