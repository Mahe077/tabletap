"use client"

import type React from "react"

import { useState } from "react"
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

export default function NewCategoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    display_order: 0,
  })

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
      const { data: lastCategory } = await supabase
        .from("menu_categories")
        .select("display_order")
        .eq("restaurant_id", restaurant.id)
        .order("display_order", { ascending: false })
        .limit(1)
        .single()

      const nextDisplayOrder = lastCategory ? lastCategory.display_order + 1 : 1

      // Create the category
      const { error } = await supabase.from("menu_categories").insert({
        ...formData,
        restaurant_id: restaurant.id,
        display_order: nextDisplayOrder,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Category created successfully!",
      })

      router.push("/dashboard/menu")
    } catch (error) {
      console.error("Error creating category:", error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Add New Category</h1>
        <p className="text-gray-600 mt-2">Create a new menu category to organize your items</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Enter the details for your new menu category</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Appetizers, Main Courses, Desserts"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this category"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active (visible to customers)</Label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Creating..." : "Create Category"}
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
