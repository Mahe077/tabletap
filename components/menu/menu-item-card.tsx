"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Clock, Leaf, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category_id: string | null
  dietary_info: string[] | null
  allergens: string[] | null
  preparation_time: number | null
  menu_categories: { name: string } | null
  // New nutrition fields
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fiber: number | null
  sugar: number | null
  sodium: number | null
}

interface MenuItemCardProps {
  item: MenuItem
  quantity: number
  onAddToCart: (item: MenuItem, quantity?: number, specialInstructions?: string) => void
  onUpdateCart: (itemId: string, quantity: number) => void
}

export function MenuItemCard({
  item,
  quantity,
  onAddToCart,
  onUpdateCart,
}: MenuItemCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isNutritionExpanded, setIsNutritionExpanded] = useState(false)

  const getDietaryIcon = (info: string) => {
    switch (info.toLowerCase()) {
      case "vegetarian":
      case "vegan":
        return <Leaf className="h-3 w-3 text-green-600" />
      default:
        return null
    }
  }

  const toggleDescriptionExpanded = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded)
  }

  const descriptionLines = item.description ? item.description.split(/\r\n|\r|\n/).length : 0
  const showReadMore = descriptionLines > 2 || (item.description && item.description.length > 100) // Heuristic for long description

  const hasNutritionInfo =
    item.calories || item.protein || item.carbs || item.fat || item.fiber || item.sugar || item.sodium

  return (
    <Card key={item.id} className="menu-item-card overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative">
          <div className="aspect-[4/3] w-full">
            <img
              src={item.image_url || "/placeholder.svg?height=240&width=320&query=delicious food dish"}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          {/* Price overlay */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="font-bold text-gray-900">Rs. {item.price}</span>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.name}</h3>
            {item.description && (
              <div>
                <p
                  className={`text-gray-600 text-sm ${!isDescriptionExpanded && showReadMore ? "line-clamp-2" : ""}`}
                >
                  {item.description}
                </p>
                {showReadMore && (
                  <Button variant="link" onClick={toggleDescriptionExpanded} className="p-0 h-auto text-blue-600">
                    {isDescriptionExpanded ? "Show Less" : "Read More"}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Dietary Info and Allergens */}
          <div className="flex flex-wrap gap-1 mb-3">
            {item.dietary_info?.map((info) => (
              <Badge key={info} variant="outline" className="text-xs flex items-center space-x-1">
                {getDietaryIcon(info)}
                <span>{info}</span>
              </Badge>
            ))}
            {item.allergens?.map((allergen) => (
              <Badge
                key={allergen}
                variant="outline"
                className="text-xs flex items-center space-x-1 text-red-600"
              >
                <AlertTriangle className="h-3 w-3" />
                <span>{allergen}</span>
              </Badge>
            ))}
          </div>

          {/* Nutrition Information */}
          {hasNutritionInfo && (
            <Collapsible open={isNutritionExpanded} onOpenChange={setIsNutritionExpanded} className="w-full mb-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-0 text-sm text-gray-600 hover:bg-transparent hover:text-gray-900">
                  <span>Nutrition Facts</span>
                  {isNutritionExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                {item.calories && <p>Calories: {item.calories} kcal</p>}
                {item.protein && <p>Protein: {item.protein} g</p>}
                {item.carbs && <p>Carbohydrates: {item.carbs} g</p>}
                {item.fat && <p>Fat: {item.fat} g</p>}
                {item.fiber && <p>Fiber: {item.fiber} g</p>}
                {item.sugar && <p>Sugar: {item.sugar} g</p>}
                {item.sodium && <p>Sodium: {item.sodium} mg</p>}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {item.preparation_time && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{item.preparation_time}min</span>
                </div>
              )}
            </div>

            {quantity === 0 ? (
              <Button onClick={() => onAddToCart(item)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateCart(item.id, quantity - 1)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Badge variant="secondary" className="px-3 py-1 font-medium">
                  {quantity}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateCart(item.id, quantity + 1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
