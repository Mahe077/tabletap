'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Space } from "lucide-react";
import { Suspense } from "react";
import { MenuCategories } from "@/components/dashboard/menu/menu-categories";
import { MenuCategoriesSkeleton } from "@/components/dashboard/menu/menu-categories-skeleton";
import { MenuItems } from "@/components/dashboard/menu/menu-items";
import { MenuItemsSkeleton } from "@/components/dashboard/menu/menu-items-skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface MenuPageContentProps {
  categories: any[]; // Replace 'any' with your actual category type if available
  menuItems: any[];  // Replace 'any' with your actual menu item type if available
  totalCount: number;
  page: number;
  pageSize: number;
}

export function MenuPageContent({ categories, menuItems, totalCount, page, pageSize }: MenuPageContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = useCallback(
    (pageNumber: number | string) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', pageNumber.toString());
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const totalPages = Math.ceil(totalCount / pageSize);

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

      <Suspense fallback={<MenuCategoriesSkeleton />}>
        <MenuCategories categories={categories ?? []} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>All your menu items across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<MenuItemsSkeleton />}>
            <MenuItems menuItems={menuItems ?? []} />
          </Suspense>
        </CardContent>
      </Card>
      <br />
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={createPageURL(page - 1)}
              aria-disabled={page <= 1}
              tabIndex={page <= 1 ? -1 : undefined}
              className={
                page <= 1 ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
          {Array.from({ length: totalPages }).map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink href={createPageURL(i + 1)} isActive={page === i + 1}>
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href={createPageURL(page + 1)}
              aria-disabled={page >= totalPages}
              tabIndex={page >= totalPages ? -1 : undefined}
              className={
                page >= totalPages ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
