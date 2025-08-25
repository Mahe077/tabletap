
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, ShoppingBag, TrendingUp, Users } from "lucide-react";

export async function DashboardStats({ restaurantId }: { restaurantId: string }) {
  const supabase = await createClient();

  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const restaurant = await supabase.from('restaurants').select('id').eq('owner_id', user.id).single();

  if (!restaurant.data) {
    return null;
  }

  const [
    { data: todayRevenue },
    { data: monthRevenue },
    { data: totalRevenue },
    { count: menuItemsCount },
  ] = await Promise.all([
    supabase.rpc('get_today_revenue', { restaurant_id_param: restaurant.data.id }),
    supabase.rpc('get_month_revenue', { restaurant_id_param: restaurant.data.id }),
    supabase.rpc('get_total_revenue', { restaurant_id_param: restaurant.data.id }),
    supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('restaurant_id', restaurant.data.id),
  ]);

  const stats = [
    {
      title: "Today's Revenue",
      value: `Rs. ${todayRevenue?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Monthly Revenue",
      value: `Rs. ${monthRevenue?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Revenue",
      value: `Rs. ${totalRevenue?.toLocaleString() || 0}`,
      icon: ShoppingBag,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Menu Items",
      value: menuItemsCount || 0,
      icon: UtensilsCrossed,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
