-- Setup Storage Bucket for User Images
-- Run this SQL in your Supabase SQL Editor

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Create the storage bucket (if it doesn't exist)
-- Note: If bucket creation fails, create it manually in Supabase Dashboard -> Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_images', 'user_images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Allow authenticated users to upload to user_images bucket
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user_images');

-- Allow authenticated users to update images in user_images bucket
CREATE POLICY "Authenticated users can update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user_images')
WITH CHECK (bucket_id = 'user_images');

-- Allow authenticated users to delete images in user_images bucket
CREATE POLICY "Authenticated users can delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user_images');

-- Allow public to view images (since bucket is public)
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user_images');
