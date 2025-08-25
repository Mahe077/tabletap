-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true);

-- Create RLS policies for the storage bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload menu images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own menu images" ON storage.objects 
FOR UPDATE USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own menu images" ON storage.objects 
FOR DELETE USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');
