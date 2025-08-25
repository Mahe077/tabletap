import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Edit, Trash2, UtensilsCrossed } from "lucide-react"

export default async function MenuPage() {
  const supabase = await createClient()

  // Get user's restaurant
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Loading...</div>
  }

  const { data: restaurant } = await supabase.from("restaurants").select("id, name").eq("owner_id", user.id).single()

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
    )
  }

  const [{ data: categories }, { data: menuItems }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, description, is_active, display_order")
      .eq("restaurant_id", restaurant.id)
      .order("display_order"),
    supabase
      .from("menu_items")
      .select(`
        id,
        name,
        description,
        price,
        is_available,
        is_featured,
        preparation_time,
        dietary_info,
        display_order,
        image_url,
        menu_categories (name)
      `)
      .eq("restaurant_id", restaurant.id)
      .order("display_order"),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-2">Manage your restaurant's menu categories and items</p>
        </div>
        <div className="flex space-x-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/menu/categories/new" prefetch={true}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard/menu/items/new" prefetch={true}>
              <Plus className="mr-2 h-4 w-4" />
              Add Menu Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Categories Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Menu Categories</CardTitle>
          <CardDescription>Organize your menu items into categories</CardDescription>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {category.description && <p className="text-sm text-gray-600 mb-3">{category.description}</p>}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No categories yet</p>
              <p className="text-sm">Create your first menu category to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Menu Items Section */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>All your menu items across categories</CardDescription>
        </CardHeader>
        <CardContent>
          {menuItems && menuItems.length > 0 ? (
            <div className="space-y-4">
              {menuItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex space-x-4 flex-1">
                      {item.image_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={item.image_url || "/placeholder.svg"}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <Badge variant={item.is_available ? "default" : "secondary"}>
                            {item.is_available ? "Available" : "Unavailable"}
                          </Badge>
                          {item.is_featured && <Badge variant="outline">Featured</Badge>}
                        </div>
                        {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Rs. {item.price}</span>
                          {item.menu_categories && <span>Category: {item.menu_categories.name}</span>}
                          {item.preparation_time && <span>{item.preparation_time} min prep</span>}
                        </div>
                        {item.dietary_info && item.dietary_info.length > 0 && (
                          <div className="flex space-x-1 mt-2">
                            {item.dietary_info.map((info) => (
                              <Badge key={info} variant="outline" className="text-xs">
                                {info}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No menu items yet</p>
              <p className="text-sm">Add your first menu item to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
