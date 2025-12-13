-- Update Products RLS Policies to Allow Regular Users to View Products
-- Run this SQL in your Supabase SQL Editor

-- Drop existing SELECT policy for farmers only
DROP POLICY IF EXISTS "Farmers can view own products" ON products;

-- Create new policy that allows all authenticated users to view all active products
CREATE POLICY "Authenticated users can view all active products"
    ON products
    FOR SELECT
    TO authenticated
    USING (status = 'Active');

-- Keep existing policies for farmers to manage their products
-- (These should already exist, but we'll ensure they're there)

-- Farmers can insert own products (should already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND policyname = 'Farmers can insert own products'
    ) THEN
        CREATE POLICY "Farmers can insert own products"
            ON products
            FOR INSERT
            WITH CHECK (auth.uid() = farmer_id);
    END IF;
END $$;

-- Farmers can update own products (should already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND policyname = 'Farmers can update own products'
    ) THEN
        CREATE POLICY "Farmers can update own products"
            ON products
            FOR UPDATE
            USING (auth.uid() = farmer_id)
            WITH CHECK (auth.uid() = farmer_id);
    END IF;
END $$;

-- Farmers can delete own products (should already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND policyname = 'Farmers can delete own products'
    ) THEN
        CREATE POLICY "Farmers can delete own products"
            ON products
            FOR DELETE
            USING (auth.uid() = farmer_id);
    END IF;
END $$;

