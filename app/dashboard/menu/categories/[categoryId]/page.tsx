"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { saveMenuCategory } from "@/app/dashboard/menu/actions" // Import the new action

interface CategoryFormState {
  id?: string; // For editing existing categories
  name: string;
  description: string;
  is_active: boolean;
  display_order: string;
}

interface EditCategoryPageProps {
  params: Promise<{
    categoryId?: string;
  }>;
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CategoryFormState>({
    name: "",
    description: "",
    is_active: true,
    display_order: "",
  })

  const unwrappedParams = use(params) // 👈 unwrap the Promise
  const categoryId = unwrappedParams?.categoryId
  const isEditing = !!categoryId

  useEffect(() => {
    if (isEditing && categoryId) {
      loadCategory(categoryId);
    }
  }, [isEditing, categoryId]);

  const loadCategory = async (id: string) => {
    setLoading(true);
    try {
      const supabase = await createClient();
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

      const { data: category, error } = await supabase
        .from("menu_categories")
        .select("id, name, description, is_active, display_order")
        .eq("id", id)
        .eq("restaurant_id", restaurantData.id)
        .single();

      if (error) throw error;

      if (category) {
        setFormData({
          id: category.id,
          name: category.name,
          description: category.description || "",
          is_active: category.is_active,
          display_order: category.display_order?.toString() || "",
        });
      }
    } catch (error) {
      console.error("Error loading category:", error);
      toast({
        title: "Error",
        description: "Failed to load category data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const categoryData = {
      id: formData.id,
      name: formData.name,
      description: formData.description || null,
      is_active: formData.is_active,
      display_order: formData.display_order ? Number.parseInt(formData.display_order) : 1,
    };

    const { success, error } = await saveMenuCategory(categoryData);

    if (success) {
      toast({
        title: "Success",
        description: `Category ${isEditing ? "updated" : "created"} successfully!`, 
      });
      router.push("/dashboard/menu");
    } else {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} category: ${error}`,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/menu">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{isEditing ? "Edit Menu Category" : "Add New Menu Category"}</h1>
        <p className="text-gray-600 mt-2">{isEditing ? "Modify your menu category" : "Create a new category for your menu"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Enter the details for your menu category</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Appetizers"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your category..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                placeholder="1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Save Changes" : "Create Category"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/menu/categories">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
