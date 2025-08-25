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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { saveMenuItem } from "@/app/dashboard/menu/actions" // Import the new action

interface Category {
  id: string
  name: string
}

interface MenuItemFormState {
  id?: string; // For editing existing items
  name: string;
  description: string;
  price: string;
  category_id: string;
  preparation_time: string;
  dietary_info: string[];
  is_available: boolean;
  is_featured: boolean;
  image_url: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
}

interface NewMenuItemPageProps {
  params: Promise<{
    itemId?: string;
  }>;
}

export default function NewMenuItemPage({ params }: NewMenuItemPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState<MenuItemFormState>({
    name: "",
    description: "",
    price: "",
    category_id: "",
    preparation_time: "",
    dietary_info: [],
    is_available: true,
    is_featured: false,
    image_url: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    sugar: "",
    sodium: "",
  })

  const unwrappedParams = use(params) // 👈 unwrap the Promise
  const itemId = unwrappedParams?.itemId
  const isEditing = !!itemId
  console.log("Item ID from params:", itemId)

  useEffect(() => {
    const fetchData = async () => {
      await loadCategories();
      if (isEditing && itemId) {
        loadMenuItem(itemId);
      }
    };
    fetchData();
  }, [isEditing, itemId]);

  const loadCategories = async () => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user?.id).single();

      if (restaurant) {
        const { data: categoriesData } = await supabase
          .from("menu_categories")
          .select("id, name")
          .eq("restaurant_id", restaurant.id)
          .eq("is_active", true)
          .order("display_order");

        setCategories(categoriesData || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadMenuItem = async (itemId: string) => {
    setLoading(true);
    try {
      const supabase = await createClient();
      const { data: menuItem, error } = await supabase
        .from("menu_items")
        .select(
          "id, name, description, price, category_id, preparation_time, dietary_info, is_available, is_featured, image_url, calories, protein, carbs, fat, fiber, sugar, sodium"
        )
        .eq("id", itemId)
        .single();

      if (error) throw error;

      if (menuItem) {
        console.log("Fetched MenuItem:", menuItem);
        setFormData({
          id: menuItem.id,
          name: menuItem.name,
          description: menuItem.description || "",
          price: menuItem.price.toString(),
          category_id: menuItem.category_id || "",
          preparation_time: menuItem.preparation_time?.toString() || "",
          dietary_info: menuItem.dietary_info || [],
          is_available: menuItem.is_available,
          is_featured: menuItem.is_featured,
          image_url: menuItem.image_url || "",
          calories: menuItem.calories?.toString() || "",
          protein: menuItem.protein?.toString() || "",
          carbs: menuItem.carbs?.toString() || "",
          fat: menuItem.fat?.toString() || "",
          fiber: menuItem.fiber?.toString() || "",
          sugar: menuItem.sugar?.toString() || "",
          sodium: menuItem.sodium?.toString() || "",
        });
      }
    } catch (error) {
      console.error("Error loading menu item:", error);
      toast({
        title: "Error",
        description: "Failed to load menu item data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const itemData = {
      id: formData.id,
      name: formData.name,
      description: formData.description || null,
      price: Number.parseFloat(formData.price),
      category_id: formData.category_id,
      preparation_time: formData.preparation_time ? Number.parseInt(formData.preparation_time) : null,
      dietary_info: formData.dietary_info.length > 0 ? formData.dietary_info : null,
      is_available: formData.is_available,
      is_featured: formData.is_featured,
      image_url: formData.image_url || null,
      calories: formData.calories ? Number.parseFloat(formData.calories) : null,
      protein: formData.protein ? Number.parseFloat(formData.protein) : null,
      carbs: formData.carbs ? Number.parseFloat(formData.carbs) : null,
      fat: formData.fat ? Number.parseFloat(formData.fat) : null,
      fiber: formData.fiber ? Number.parseFloat(formData.fiber) : null,
      sugar: formData.sugar ? Number.parseFloat(formData.sugar) : null,
      sodium: formData.sodium ? Number.parseFloat(formData.sodium) : null,
    };

    const { success, error } = await saveMenuItem(itemData);

    if (success) {
      toast({
        title: "Success",
        description: `Menu item ${isEditing ? "updated" : "created"} successfully!`, 
      });
      router.push("/dashboard/menu");
    } else {
      console.error("Error saving menu item:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} menu item: ${error}`,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const dietaryOptions = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Spicy", "Halal"];

  const toggleDietaryInfo = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      dietary_info: prev.dietary_info.includes(option)
        ? prev.dietary_info.filter((item) => item !== option)
        : [...prev.dietary_info, option],
    }));
  };
  console.log("Dietary Info:", formData.dietary_info);
  console.log("Category ID:", formData, "Loading...", loading);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/menu">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{isEditing ? "Edit Menu Item" : "Add New Menu Item"}</h1>
        <p className="text-gray-600 mt-2">{isEditing ? "Modify your menu item" : "Create a new item for your menu"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Item Details</CardTitle>
          <CardDescription>Enter the details for your menu item</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              onRemove={() => setFormData({ ...formData, image_url: "" })}
              disabled={loading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chicken Curry"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (Rs.) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length === 0 && (
                <p className="text-sm text-gray-500">
                  No categories available.{" "}
                  <Link href="/dashboard/menu/categories/new" className="text-blue-600 hover:underline">
                    Create one first
                  </Link>
                  .
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your dish..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparation_time">Preparation Time (minutes)</Label>
              <Input
                id="preparation_time"
                type="number"
                value={formData.preparation_time}
                onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                placeholder="15"
              />
            </div>

            {/* Nutrition Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nutrition Information (per serving)</CardTitle>
                <CardDescription>Optional: Provide nutritional values for this item.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    step="0.01"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.01"
                    value={formData.protein}
                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbohydrates (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    step="0.01"
                    value={formData.carbs}
                    onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    step="0.01"
                    value={formData.fat}
                    onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiber">Fiber (g)</Label>
                  <Input
                    id="fiber"
                    type="number"
                    step="0.01"
                    value={formData.fiber}
                    onChange={(e) => setFormData({ ...formData, fiber: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sugar">Sugar (g)</Label>
                  <Input
                    id="sugar"
                    type="number"
                    step="0.01"
                    value={formData.sugar}
                    onChange={(e) => setFormData({ ...formData, sugar: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sodium">Sodium (mg)</Label>
                  <Input
                    id="sodium"
                    type="number"
                    step="0.01"
                    value={formData.sodium}
                    onChange={(e) => setFormData({ ...formData, sodium: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Dietary Information</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {dietaryOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={option}
                      checked={formData.dietary_info.includes(option)}
                      onChange={() => toggleDietaryInfo(option)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={option} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="is_available">Available</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Featured Item</Label>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !formData.category_id}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Save Changes" : "Create Menu Item"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/menu">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
