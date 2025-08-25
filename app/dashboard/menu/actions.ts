
'use server';

import { createClient } from '@/lib/supabase/server';
import { unstable_cache as cache, revalidateTag } from 'next/cache';

export async function getMenuData(restaurantId: string, page = 1, pageSize = 10) {
  const supabase = await createClient();

  return await cache(
    async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const [
        { data: categories },
        { data: menuItems, count },
      ] = await Promise.all([
        supabase
          .from('menu_categories')
          .select('id, name, description, is_active, display_order')
          .eq('restaurant_id', restaurantId)
          .order('display_order'),
        supabase
          .from('menu_items')
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
            menu_categories (name),
            calories,
            protein,
            carbs,
            fat,
            fiber,
            sugar,
            sodium
          `, { count: 'exact' })
          .eq('restaurant_id', restaurantId)
          .order('display_order')
          .range(from, to),
      ]);

      return { categories, menuItems, totalCount: count };
    },
    [`menu-data-${restaurantId}-${page}-${pageSize}`],
    { revalidate: 60, tags: [`menu-data-${restaurantId}`] }
  )();
}

interface SaveMenuItemData {
  id?: string; // Optional for new items
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  preparation_time: number | null;
  dietary_info: string[] | null;
  is_available: boolean;
  is_featured: boolean;
  image_url: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
}

export async function saveMenuItem(data: SaveMenuItemData) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', user.user.id).single();
  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  const { id, ...itemData } = data;

  try {
    let error = null;
    if (id) {
      // Update existing item
      const { error: updateError } = await supabase.from('menu_items').update(itemData).eq('id', id);
      error = updateError;
    } else {
      // Insert new item
      const { data: lastItem } = await supabase
        .from('menu_items')
        .select('display_order')
        .eq('restaurant_id', restaurant.id)
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      const nextDisplayOrder = lastItem ? lastItem.display_order + 1 : 1;

      const { error: insertError } = await supabase.from('menu_items').insert({
        ...itemData,
        restaurant_id: restaurant.id,
        display_order: nextDisplayOrder,
      });
      error = insertError;
    }

    if (error) {
      console.error('Error saving menu item:', error);
      throw new Error(`Failed to save menu item: ${error.message}`);
    }

    revalidateTag(`menu-data-${restaurant.id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteMenuItem(itemId: string) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', user.user.id).single();
  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  try {
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId).eq('restaurant_id', restaurant.id);
    if (error) {
      console.error('Error deleting menu item:', error);
      throw new Error(`Failed to delete menu item: ${error.message}`);
    }

    revalidateTag(`menu-data-${restaurant.id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
