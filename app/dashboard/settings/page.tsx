import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import SettingsForm from "./settings-form";
import { unstable_cache as cache } from "next/cache";

async function getRestaurantData(userId: string) {
  const supabase = await createClient();
  return await cache(
    async () => {
      const { data: restaurant } = await supabase.from("restaurants").select("*").eq("owner_id", userId).single();
      return restaurant;
    },
    [`restaurant-data-${userId}`],
    { revalidate: 60, tags: [`restaurant-data-${userId}`] }
  )();
}

function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="bg-white rounded-lg border p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Loading...</div>;
  }

  const restaurant = await getRestaurantData(user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Settings</h1>
        <p className="text-gray-600 mt-2">
          {restaurant ? "Update your restaurant information" : "Set up your restaurant profile"}
        </p>
      </div>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsForm restaurant={restaurant} />
      </Suspense>
    </div>
  );
}