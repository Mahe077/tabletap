-- Drop existing problematic policies for orders table
DROP POLICY IF EXISTS "Public can create orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can view their restaurant orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can update their restaurant orders" ON orders;

-- Create new, more explicit policies for orders
-- Drop the old permissive insert policy for orders
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;

-- Allow anonymous users to insert orders
CREATE POLICY "Anon can create orders" ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow restaurant owners to view orders for their restaurants
CREATE POLICY "Restaurant owners can view their orders" ON orders
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = orders.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Allow restaurant owners to update orders for their restaurants
CREATE POLICY "Restaurant owners can update their orders" ON orders
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = orders.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Allow customers to view their own orders based on phone number
CREATE POLICY "Customer can view their own orders"
ON orders
FOR SELECT
TO public
USING (
  customer_id IN (
    SELECT id 
    FROM customers 
    WHERE phone = current_setting('request.customer_phone', true)::text
  )
);

-- Also fix order_items policies to be more explicit
DROP POLICY IF EXISTS "Public can create order items" ON order_items;
DROP POLICY IF EXISTS "Restaurant owners can view their order items" ON order_items;

-- Allow anyone to insert order items (for customer ordering)
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT 
  WITH CHECK (true);

-- Allow restaurant owners to view order items for their restaurants
CREATE POLICY "Restaurant owners can view their order items" ON order_items
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_items.order_id 
      AND restaurants.owner_id = auth.uid()
    )
  );
