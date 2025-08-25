import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import QRCodeGenerator from "./qr-code-generator";
import { unstable_cache as cache } from "next/cache";

async function getRestaurantData(userId: string) {
  const supabase = await createClient();
  return await cache(
    async () => {
      const { data: restaurant } = await supabase.from("restaurants").select("id, name").eq("owner_id", userId).single();
      return restaurant;
    },
    [`restaurant-data-${userId}`],
    { revalidate: 60, tags: [`restaurant-data-${userId}`] }
  )();
}

function QRCodeSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle><div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div></CardTitle>
          <CardDescription><div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle><div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div></CardTitle>
          <CardDescription><div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div></CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="w-64 h-64 bg-gray-200 rounded-lg animate-pulse mx-auto"></div>
          <div className="flex justify-center space-x-3">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function QRCodePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Loading...</div>;
  }

  const restaurant = await getRestaurantData(user.id);

  if (!restaurant) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Restaurant Setup Required</CardTitle>
            <CardDescription className="text-orange-700">
              Please set up your restaurant profile first to generate QR codes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
        <p className="text-gray-600 mt-2">Generate QR codes for your restaurant tables</p>
      </div>
      <Suspense fallback={<QRCodeSkeleton />}>
        <QRCodeGenerator restaurant={restaurant} />
      </Suspense>
    </div>
  );
}