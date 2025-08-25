-- Insert sample restaurant
INSERT INTO restaurants (id, name, description, address, phone, owner_id, is_active) 
VALUES (
  'sample-restaurant-1',
  'Spice Garden Restaurant',
  'Authentic Sri Lankan cuisine with modern presentation',
  '123 Galle Road, Colombo 03',
  '+94 11 234 5678',
  (SELECT id FROM auth.users LIMIT 1),
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert sample categories
INSERT INTO menu_categories (id, restaurant_id, name, description, display_order, is_active)
VALUES 
  ('cat-1', 'sample-restaurant-1', 'Appetizers', 'Start your meal with these delicious appetizers', 1, true),
  ('cat-2', 'sample-restaurant-1', 'Rice & Curry', 'Traditional Sri Lankan rice and curry dishes', 2, true),
  ('cat-3', 'sample-restaurant-1', 'Kottu & Fried Rice', 'Popular street food favorites', 3, true),
  ('cat-4', 'sample-restaurant-1', 'Beverages', 'Refreshing drinks and traditional beverages', 4, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, is_available, display_order, preparation_time, dietary_info, allergens)
VALUES 
  ('item-1', 'sample-restaurant-1', 'cat-1', 'Fish Cutlets', 'Crispy fish cutlets served with mint chutney', 450.00, true, 1, 15, '["Non-Vegetarian"]', '["Fish", "Gluten"]'),
  ('item-2', 'sample-restaurant-1', 'cat-1', 'Vegetable Spring Rolls', 'Fresh vegetables wrapped in crispy pastry', 350.00, true, 2, 10, '["Vegetarian"]', '["Gluten"]'),
  ('item-3', 'sample-restaurant-1', 'cat-2', 'Chicken Curry with Rice', 'Spicy chicken curry served with steamed rice and papadam', 850.00, true, 1, 25, '["Non-Vegetarian"]', '["None"]'),
  ('item-4', 'sample-restaurant-1', 'cat-2', 'Fish Curry with Rice', 'Traditional fish curry with coconut milk and rice', 950.00, true, 2, 30, '["Non-Vegetarian"]', '["Fish"]'),
  ('item-5', 'sample-restaurant-1', 'cat-2', 'Vegetable Curry with Rice', 'Mixed vegetable curry with rice and accompaniments', 650.00, true, 3, 20, '["Vegetarian"]', '["None"]'),
  ('item-6', 'sample-restaurant-1', 'cat-3', 'Chicken Kottu', 'Chopped roti stir-fried with chicken and vegetables', 750.00, true, 1, 20, '["Non-Vegetarian"]', '["Gluten"]'),
  ('item-7', 'sample-restaurant-1', 'cat-3', 'Vegetable Fried Rice', 'Wok-fried rice with mixed vegetables and egg', 550.00, true, 2, 15, '["Vegetarian"]', '["Egg"]'),
  ('item-8', 'sample-restaurant-1', 'cat-4', 'Fresh Lime Juice', 'Freshly squeezed lime juice with mint', 200.00, true, 1, 5, '["Vegan"]', '["None"]'),
  ('item-9', 'sample-restaurant-1', 'cat-4', 'King Coconut Water', 'Fresh king coconut water', 150.00, true, 2, 2, '["Vegan"]', '["None"]'),
  ('item-10', 'sample-restaurant-1', 'cat-4', 'Ceylon Tea', 'Traditional Sri Lankan black tea', 100.00, true, 3, 5, '["Vegan"]', '["None"]')
ON CONFLICT (id) DO NOTHING;
