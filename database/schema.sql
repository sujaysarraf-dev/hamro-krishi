-- Smart Farm App Database Schema - Complete Setup
-- Run this SQL in your Supabase SQL Editor
-- This will drop and recreate everything from scratch

-- ============================================
-- DROP EXISTING OBJECTS (Safe to re-run)
-- ============================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_farms_updated_at ON farms;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Drop storage policies
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Drop table policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Farmers can view own farms" ON farms;
DROP POLICY IF EXISTS "Farmers can insert own farms" ON farms;
DROP POLICY IF EXISTS "Farmers can update own farms" ON farms;
DROP POLICY IF EXISTS "Farmers can delete own farms" ON farms;

-- Drop user_interests table policies (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_interests') THEN
        DROP POLICY IF EXISTS "Users can view own interests" ON user_interests;
        DROP POLICY IF EXISTS "Users can insert own interests" ON user_interests;
        DROP POLICY IF EXISTS "Users can update own interests" ON user_interests;
        DROP POLICY IF EXISTS "Users can delete own interests" ON user_interests;
    END IF;
END $$;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_profiles_role;
DROP INDEX IF EXISTS idx_user_profiles_email;
DROP INDEX IF EXISTS idx_user_profiles_interests;
DROP INDEX IF EXISTS idx_farms_farmer_id;
DROP INDEX IF EXISTS idx_user_interests_user_id;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS farms CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop storage bucket (optional - comment out if you want to keep existing images)
-- DELETE FROM storage.buckets WHERE id = 'user_images';

-- ============================================
-- CREATE EXTENSIONS
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE TABLES
-- ============================================

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'regular')),
    full_name TEXT,
    avatar_url TEXT,
    interests JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create farms table (optional, for farmers)
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    location TEXT,
    farm_type TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_interests ON user_profiles USING GIN (interests);

-- Index for farms
CREATE INDEX idx_farms_farmer_id ON farms(farmer_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- User Profiles Policies
CREATE POLICY "Users can view own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Farms Policies
CREATE POLICY "Farmers can view own farms"
    ON farms
    FOR SELECT
    USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can insert own farms"
    ON farms
    FOR INSERT
    WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update own farms"
    ON farms
    FOR UPDATE
    USING (auth.uid() = farmer_id)
    WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can delete own farms"
    ON farms
    FOR DELETE
    USING (auth.uid() = farmer_id);

-- ============================================
-- CREATE FUNCTIONS
-- ============================================

-- Function to automatically create a profile when a user signs up
-- SECURITY DEFINER allows the function to bypass RLS policies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, role, full_name, interests)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::text, 'regular'),
        COALESCE((NEW.raw_user_meta_data->>'full_name')::text, NULL),
        '[]'::jsonb
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        role = COALESCE(EXCLUDED.role, user_profiles.role),
        updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE TRIGGERS
-- ============================================

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update updated_at for farms
CREATE TRIGGER update_farms_updated_at
    BEFORE UPDATE ON farms
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================

-- Create the storage bucket for user images (if it doesn't exist)
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

-- ============================================
-- VERIFICATION (Optional - uncomment to verify)
-- ============================================

-- Verify tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('user_profiles', 'farms');

-- Verify columns in user_profiles
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' ORDER BY ordinal_position;

-- Verify storage bucket was created
-- SELECT id, name, public FROM storage.buckets WHERE id = 'user_images';
