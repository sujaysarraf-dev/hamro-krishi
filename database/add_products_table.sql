-- Add Products/Crops Table for Farmers
-- Run this SQL in your Supabase SQL Editor

-- Drop table if exists (this will cascade and remove all dependent objects)
DROP TABLE IF EXISTS products CASCADE;

-- Drop indexes if they exist (in case table was dropped but indexes remain)
DROP INDEX IF EXISTS idx_products_farmer_id;
DROP INDEX IF EXISTS idx_products_status;

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_unit TEXT NOT NULL DEFAULT 'kilograms',
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_products_farmer_id ON products(farmer_id);
CREATE INDEX idx_products_status ON products(status);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Farmers can view own products"
    ON products
    FOR SELECT
    USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can insert own products"
    ON products
    FOR INSERT
    WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update own products"
    ON products
    FOR UPDATE
    USING (auth.uid() = farmer_id)
    WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can delete own products"
    ON products
    FOR DELETE
    USING (auth.uid() = farmer_id);

-- Create trigger for updated_at (make sure handle_updated_at function exists)
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
