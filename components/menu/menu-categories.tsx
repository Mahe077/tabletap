"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Category {
  id: string
  name: string
  description: string | null
}

interface MenuCategoriesProps {
  categories: Category[]
  selectedCategory: string | null
  onCategorySelect: (categoryId: string | null) => void
  loading: boolean; // Add loading prop
}

export function MenuCategories({ categories, selectedCategory, onCategorySelect, loading }: MenuCategoriesProps) {
  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? "destructive" : "outline"}
          onClick={() => onCategorySelect(null)}
          className="whitespace-nowrap bg-transparent"
        >
          All Items
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "destructive" : "outline"}
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
