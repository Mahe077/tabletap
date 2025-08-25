
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, UtensilsCrossed } from "lucide-react";

export function MenuCategories({ categories }: { categories: any[] }) {
  return (
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
  );
}
