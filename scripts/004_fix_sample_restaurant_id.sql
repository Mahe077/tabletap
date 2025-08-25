-- Update sample restaurant ID to match QR code generation
UPDATE restaurants 
SET id = 'sample-restaurant-1' 
WHERE name = 'Spice Garden Restaurant';

-- Ensure the restaurant has the correct owner_id for testing
-- You may need to update this with your actual user ID after signing up
