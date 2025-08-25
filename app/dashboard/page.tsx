import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UtensilsCrossed, ShoppingBag, QrCode, Settings, Plus } from "lucide-react";
import { Suspense } from "react";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { DashboardStatsSkeleton } from "@/components/dashboard/dashboard-stats-skeleton";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { RecentOrdersSkeleton } from "@/components/dashboard/recent-orders-skeleton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Loading...</div>;
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

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
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {restaurant.name}!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your restaurant today.</p>
      </div>

      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats restaurantId={restaurant.id} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<RecentOrdersSkeleton />}>
          <RecentOrders restaurantId={restaurant.id} />
        </Suspense>

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
  );
}
