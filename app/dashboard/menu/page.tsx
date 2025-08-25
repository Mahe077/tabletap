"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Use client-side Supabase client
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getMenuData } from "./actions"; // Still use the server action for data fetching
import { MenuPageContent } from "./menu-page-content";
import { useSearchParams } from "next/navigation"; // Import useSearchParams
import { MenuCategoriesSkeleton } from "@/components/dashboard/menu/menu-categories-skeleton"; // Import skeleton
import { MenuItemsSkeleton } from "@/components/dashboard/menu/menu-items-skeleton"; // Import skeleton

export default function MenuPage() {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

  const [user, setUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setUser(userData.user);

        if (!userData.user) {
          setLoading(false);
          return;
        }

        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("id, name")
          .eq("owner_id", userData.user.id)
          .single();

        if (restaurantError) throw restaurantError;
        setRestaurant(restaurantData);

        if (!restaurantData) {
          setLoading(false);
          return;
        }

        const { categories: fetchedCategories, menuItems: fetchedMenuItems, totalCount: fetchedTotalCount } = await getMenuData(restaurantData.id, page);
        setCategories(fetchedCategories ?? []);
        setMenuItems(fetchedMenuItems ?? []);
        setTotalCount(fetchedTotalCount ?? 0);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page]); // Re-fetch data when page changes

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-600 mt-2">Manage your restaurant's menu categories and items</p>
          </div>
          {/* Add Category and Add Menu Item buttons can be rendered here if they don't depend on fetched data */}
        </div>
        <MenuCategoriesSkeleton />
        <Card>
          <CardHeader>
            <CardTitle>Menu Items</CardTitle>
            <CardDescription>All your menu items across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <MenuItemsSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!user) {
    // This case should ideally be handled by auth middleware or a redirect
    return <div>Please log in to view this page.</div>;
  }

  if (!restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Restaurant Setup Required</CardTitle>
            <CardDescription className="text-orange-700">
              Please set up your restaurant profile first to manage your menu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link href="/dashboard/settings">Set Up Restaurant</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MenuPageContent
      categories={categories}
      menuItems={menuItems}
      totalCount={totalCount}
      page={page}
      pageSize={10}
    />
  );
}
