import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Suspense } from "react";
import { RevenueStats } from "@/components/dashboard/analytics/revenue-stats";
import { RevenueStatsSkeleton } from "@/components/dashboard/analytics/revenue-stats-skeleton";
import { CustomerStats } from "@/components/dashboard/analytics/customer-stats";
import { CustomerStatsSkeleton } from "@/components/dashboard/analytics/customer-stats-skeleton";
import { PopularItems } from "@/components/dashboard/analytics/popular-items";
import { PopularItemsSkeleton } from "@/components/dashboard/analytics/popular-items-skeleton";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user?.id).single();

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
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-2">Track your restaurant's performance and customer loyalty</p>
      </div>

      <Suspense fallback={<RevenueStatsSkeleton />}>
        <RevenueStats restaurantId={restaurant.id} />
      </Suspense>

      <Suspense fallback={<CustomerStatsSkeleton />}>
        <CustomerStats restaurantId={restaurant.id} />
      </Suspense>

      <Suspense fallback={<PopularItemsSkeleton />}>
        <PopularItems restaurantId={restaurant.id} />
      </Suspense>
    </div>
  );
}
