-- Add database indexes for better query performance
-- Add indexes for frequently queried columns to improve dashboard loading speed

-- Index for restaurant queries by owner_id
-- CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON restaurants(owner_id);

-- Index for menu_items queries by restaurant_id
-- CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);

-- Index for orders queries by restaurant_id
-- CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);

-- Index for orders queries by restaurant_id and created_at (for today's orders)
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created ON orders(restaurant_id, created_at DESC);

-- Index for order_items queries by order_id
-- CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Index for categories queries by restaurant_id
-- CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);

-- Index for customers queries by phone (for quick lookup)
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Composite index for real-time order subscriptions
-- CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);
