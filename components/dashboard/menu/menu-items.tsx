
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteMenuItem } from "@/app/dashboard/menu/actions";

export function MenuItems({ menuItems }: { menuItems: any[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (itemId: string) => {
    setIsDeleting(true);
    const { success, error } = await deleteMenuItem(itemId);
    if (success) {
      toast({
        title: "Success",
        description: "Menu item deleted successfully.",
      });
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: `Failed to delete menu item: ${error}`,
        variant: "destructive",
      });
    }
    setIsDeleting(false);
  };

  return (
    <div>
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
                        {item.dietary_info.map((info: string) => (
                          <Badge key={info} variant="outline" className="text-xs">
                            {info}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/menu/items/${item.id}`}>
                      <Edit className="h-3 w-3" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" disabled={isDeleting}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the menu item{" "}
                          <span className="font-semibold">{item.name}</span> from your menu.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)} disabled={isDeleting}>
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
    </div>
  );
}
