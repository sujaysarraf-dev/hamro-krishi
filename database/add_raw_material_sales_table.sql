-- Create raw_material_sales table for farmers to sell unused raw materials to industries
-- This table stores listings of raw materials that farmers want to sell

-- Drop table if exists (for easy re-running)
DROP TABLE IF EXISTS raw_material_sales CASCADE;

-- Create raw_material_sales table
CREATE TABLE raw_material_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kilograms' CHECK (unit IN ('kilograms', 'quintals', 'tons', 'liters', 'pieces')),
    description TEXT,
    contact_number TEXT NOT NULL,
    estimated_price DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sold', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_raw_material_sales_user_id ON raw_material_sales(user_id);
CREATE INDEX idx_raw_material_sales_status ON raw_material_sales(status);

-- Enable RLS
ALTER TABLE raw_material_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own sales
CREATE POLICY "Users can view own raw material sales"
    ON raw_material_sales
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own sales
CREATE POLICY "Users can insert own raw material sales"
    ON raw_material_sales
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own sales
CREATE POLICY "Users can update own raw material sales"
    ON raw_material_sales
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sales
CREATE POLICY "Users can delete own raw material sales"
    ON raw_material_sales
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_raw_material_sales_updated_at
    BEFORE UPDATE ON raw_material_sales
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

