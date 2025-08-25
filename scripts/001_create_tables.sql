-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_code_data TEXT, -- Store QR code data/URL
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu categories table
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  allergens TEXT[], -- Array of allergen information
  dietary_info TEXT[], -- vegetarian, vegan, gluten-free, etc.
  preparation_time INTEGER, -- in minutes
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table (for guest orders and loyalty)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  email TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  table_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  loyalty_points_earned INTEGER DEFAULT 0,
  loyalty_points_used INTEGER DEFAULT 0,
  special_instructions TEXT,
  estimated_ready_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants (owners can manage their own restaurants)
CREATE POLICY "Restaurant owners can view their own restaurants" ON restaurants
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Restaurant owners can insert their own restaurants" ON restaurants
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Restaurant owners can update their own restaurants" ON restaurants
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Restaurant owners can delete their own restaurants" ON restaurants
  FOR DELETE USING (auth.uid() = owner_id);

-- Public can view active restaurants (for customer menu access)
CREATE POLICY "Public can view active restaurants" ON restaurants
  FOR SELECT USING (is_active = true);

-- RLS Policies for menu_categories
CREATE POLICY "Restaurant owners can manage their menu categories" ON menu_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = menu_categories.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Public can view active menu categories
CREATE POLICY "Public can view active menu categories" ON menu_categories
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = menu_categories.restaurant_id 
      AND restaurants.is_active = true
    )
  );

-- RLS Policies for menu_items
CREATE POLICY "Restaurant owners can manage their menu items" ON menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = menu_items.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Public can view available menu items
CREATE POLICY "Public can view available menu items" ON menu_items
  FOR SELECT USING (
    is_available = true AND
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = menu_items.restaurant_id 
      AND restaurants.is_active = true
    )
  );

-- RLS Policies for customers (basic privacy)
CREATE POLICY "Customers can view their own data" ON customers
  FOR SELECT USING (true); -- Allow public read for guest orders

CREATE POLICY "Anyone can insert customer data" ON customers
  FOR INSERT WITH CHECK (true); -- Allow guest customer creation

CREATE POLICY "Customers can update their own data" ON customers
  FOR UPDATE USING (true); -- Simple policy for now

-- RLS Policies for orders
CREATE POLICY "Restaurant owners can view their restaurant orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = orders.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can update their restaurant orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = orders.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Public can insert orders (for customer ordering)
CREATE POLICY "Public can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- RLS Policies for order_items
CREATE POLICY "Restaurant owners can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_items.order_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Public can insert order items (for customer ordering)
CREATE POLICY "Public can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
