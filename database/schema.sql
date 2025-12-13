-- Smart Farm App Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
-- This table stores additional user information including role
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'regular')),
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Create policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        'regular' -- Default role, can be updated later
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Optional: Create a farms table for farmers (if needed)
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    location TEXT,
    farm_type TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on farms table
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

-- Create policy: Farmers can view their own farms
CREATE POLICY "Farmers can view own farms"
    ON farms
    FOR SELECT
    USING (auth.uid() = farmer_id);

-- Create policy: Farmers can insert their own farms
CREATE POLICY "Farmers can insert own farms"
    ON farms
    FOR INSERT
    WITH CHECK (auth.uid() = farmer_id);

-- Create policy: Farmers can update their own farms
CREATE POLICY "Farmers can update own farms"
    ON farms
    FOR UPDATE
    USING (auth.uid() = farmer_id);

-- Create policy: Farmers can delete their own farms
CREATE POLICY "Farmers can delete own farms"
    ON farms
    FOR DELETE
    USING (auth.uid() = farmer_id);

-- Create index on farmer_id
CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON farms(farmer_id);

-- Create trigger to update updated_at for farms
CREATE TRIGGER update_farms_updated_at
    BEFORE UPDATE ON farms
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add interests column as JSONB to store interests as JSON array
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb;

-- Create index on interests for faster queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_user_profiles_interests ON user_profiles USING GIN (interests);

