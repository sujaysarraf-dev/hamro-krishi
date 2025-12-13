-- Setup Storage Bucket for Product Images
-- Run this SQL in your Supabase SQL Editor

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Farmers can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Farmers can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Farmers can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- Create the storage bucket (if it doesn't exist)
-- Note: If bucket creation fails, create it manually in Supabase Dashboard -> Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Allow authenticated users (farmers) to upload product images
CREATE POLICY "Farmers can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product_images');

-- Allow authenticated users (farmers) to update product images
CREATE POLICY "Farmers can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product_images')
WITH CHECK (bucket_id = 'product_images');

-- Allow authenticated users (farmers) to delete product images
CREATE POLICY "Farmers can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product_images');

-- Allow public to view product images (since bucket is public)
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product_images');

