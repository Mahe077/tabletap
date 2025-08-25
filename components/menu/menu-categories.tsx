"use client"

import { Button } from "@/components/ui/button"

interface Category {
  id: string
  name: string
  description: string | null
}

interface MenuCategoriesProps {
  categories: Category[]
  selectedCategory: string | null
  onCategorySelect: (categoryId: string | null) => void
}

export function MenuCategories({ categories, selectedCategory, onCategorySelect }: MenuCategoriesProps) {
  return (
    <div className="mb-6">
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => onCategorySelect(null)}
          className="whitespace-nowrap bg-transparent"
        >
          All Items
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => onCategorySelect(category.id)}
            className="whitespace-nowrap bg-transparent"
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
