-- Update customers table to ensure proper loyalty tracking
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for customers table
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for restaurants table
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for menu_items table
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_points ON customers(loyalty_points);
CREATE INDEX IF NOT EXISTS idx_customers_total_orders ON customers(total_orders);

-- Create a view for order analytics
CREATE OR REPLACE VIEW order_analytics AS
SELECT 
    o.restaurant_id,
    DATE(o.created_at) as order_date,
    COUNT(*) as total_orders,
    SUM(o.total_amount) as total_revenue,
    SUM(o.loyalty_points_earned) as total_points_earned,
    SUM(o.loyalty_points_used) as total_points_used,
    AVG(o.total_amount) as avg_order_value
FROM orders o
WHERE o.status = 'completed'
GROUP BY o.restaurant_id, DATE(o.created_at);

-- Create a view for popular menu items
CREATE OR REPLACE VIEW popular_menu_items AS
SELECT 
    mi.restaurant_id,
    mi.id as menu_item_id,
    mi.name,
    mi.price,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.total_price) as total_revenue,
    COUNT(DISTINCT oi.order_id) as times_ordered
FROM menu_items mi
JOIN order_items oi ON mi.id = oi.menu_item_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY mi.restaurant_id, mi.id, mi.name, mi.price;
