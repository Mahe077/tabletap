"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
}

export default function NewMenuItemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    preparation_time: "",
    dietary_info: [] as string[],
    is_available: true,
    is_featured: false,
    image_url: "",
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user?.id).single()

      if (restaurant) {
        const { data: categoriesData } = await supabase
          .from("menu_categories")
          .select("id, name")
          .eq("restaurant_id", restaurant.id)
          .eq("is_active", true)
          .order("display_order")

        setCategories(categoriesData || [])
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Get user's restaurant
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user?.id).single()

      if (!restaurant) {
        toast({
          title: "Error",
          description: "Restaurant not found. Please set up your restaurant first.",
          variant: "destructive",
        })
        return
      }

      // Get the highest display_order for this restaurant
      const { data: lastItem } = await supabase
        .from("menu_items")
        .select("display_order")
        .eq("restaurant_id", restaurant.id)
        .order("display_order", { ascending: false })
        .limit(1)
        .single()

      const nextDisplayOrder = lastItem ? lastItem.display_order + 1 : 1

      // Create the menu item
      const { error } = await supabase.from("menu_items").insert({
        name: formData.name,
        description: formData.description || null,
        price: Number.parseFloat(formData.price),
        category_id: formData.category_id,
        preparation_time: formData.preparation_time ? Number.parseInt(formData.preparation_time) : null,
        dietary_info: formData.dietary_info.length > 0 ? formData.dietary_info : null,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        restaurant_id: restaurant.id,
        display_order: nextDisplayOrder,
        image_url: formData.image_url || null,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Menu item created successfully!",
      })

      router.push("/dashboard/menu")
    } catch (error) {
      console.error("Error creating menu item:", error)
      toast({
        title: "Error",
        description: "Failed to create menu item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const dietaryOptions = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Spicy", "Halal"]

  const toggleDietaryInfo = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      dietary_info: prev.dietary_info.includes(option)
        ? prev.dietary_info.filter((item) => item !== option)
        : [...prev.dietary_info, option],
    }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/menu">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Menu Item</h1>
        <p className="text-gray-600 mt-2">Create a new item for your menu</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Item Details</CardTitle>
          <CardDescription>Enter the details for your new menu item</CardDescription>
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
                {loading ? "Creating..." : "Create Menu Item"}
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
