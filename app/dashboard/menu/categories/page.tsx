"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteMenuCategory } from "@/app/dashboard/menu/actions";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!userData.user) {
        setLoading(false);
        return;
      }

      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", userData.user.id)
        .single();

      if (restaurantError) throw restaurantError;

      if (!restaurantData) {
        setLoading(false);
        return;
      }

      const { data: fetchedCategories, error: categoriesError } = await supabase
        .from("menu_categories")
        .select("id, name, description, is_active, display_order")
        .eq("restaurant_id", restaurantData.id)
        .order("display_order");

      if (categoriesError) throw categoriesError;
      setCategories(fetchedCategories || []);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    setIsDeleting(true);
    const { success, error } = await deleteMenuCategory(categoryId);
    if (success) {
      toast({
        title: "Success",
        description: `Category '${categoryName}' deleted successfully.`,
      });
      router.refresh(); // Re-fetch data after deletion
    } else {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error}`,
        variant: "destructive",
      });
    }
    setIsDeleting(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-48" /> {/* Title skeleton */}
          <Skeleton className="h-10 w-32" /> {/* Add New Category button skeleton */}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" /> {/* Card Title skeleton */}
            <Skeleton className="h-4 w-60" /> {/* Card Description skeleton */}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => ( // Simulate 3 category cards
                <div key={index} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <Skeleton className="h-6 w-48 mb-2" /> {/* Category name skeleton */}
                    <Skeleton className="h-4 w-64 mb-1" /> {/* Description skeleton */}
                    <Skeleton className="h-4 w-32" /> {/* Order/Active skeleton */}
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8 rounded-md" /> {/* Edit button skeleton */}
                    <Skeleton className="h-8 w-8 rounded-md" /> {/* Delete button skeleton */}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/menu">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Link>
        </Button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Menu Categories</h1>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/menu/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Category
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Categories</CardTitle>
          <CardDescription>Manage your menu categories here.</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    {category.description && <p className="text-sm text-gray-600">{category.description}</p>}
                    <p className="text-xs text-gray-500">Order: {category.display_order} | Active: {category.is_active ? "Yes" : "No"}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/menu/categories/${category.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={isDeleting}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the category{" "}
                            <span className="font-semibold">{category.name}</span> and all associated menu items.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(category.id, category.name)} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No categories found.</p>
              <p className="text-sm">Add your first menu category to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

  );
}
