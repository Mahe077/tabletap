"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Restaurant {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  is_active: boolean
}

export default function SettingsForm({ restaurant: initialRestaurant }: { restaurant: Restaurant | null }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(initialRestaurant)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    is_active: true,
  })

  useEffect(() => {
    if (initialRestaurant) {
      setRestaurant(initialRestaurant)
      setFormData({
        name: initialRestaurant.name || "",
        description: initialRestaurant.description || "",
        address: initialRestaurant.address || "",
        phone: initialRestaurant.phone || "",
        email: initialRestaurant.email || "",
        is_active: initialRestaurant.is_active,
      })
    }
  }, [initialRestaurant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const restaurantData = {
        ...formData,
        owner_id: user.id,
        updated_at: new Date().toISOString(),
      }

      let result
      if (restaurant) {
        // Update existing restaurant
        result = await supabase.from("restaurants").update(restaurantData).eq("id", restaurant.id).select().single()
      } else {
        // Create new restaurant
        result = await supabase.from("restaurants").insert(restaurantData).select().single()
      }

      if (result.error) throw result.error

      setRestaurant(result.data)
      setSuccess("Restaurant settings saved successfully!")

      // Redirect to dashboard after successful creation
      if (!restaurant) {
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    } catch (error) {
      console.error("Error saving restaurant:", error)
      setError(error instanceof Error ? error.message : "Failed to save restaurant settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{restaurant ? "Restaurant Information" : "Create Restaurant Profile"}</CardTitle>
        <CardDescription>
          {restaurant
            ? "Update your restaurant details and preferences"
            : "Complete your restaurant setup to start receiving orders"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your Restaurant Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+94 77 123 4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="restaurant@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell customers about your restaurant..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full restaurant address..."
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Restaurant is active and accepting orders</Label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
              {isSaving ? "Saving..." : restaurant ? "Update Restaurant" : "Create Restaurant"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
