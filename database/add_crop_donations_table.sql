-- Create crop_donations table for farmers to donate crops that are about to expire
-- This table stores listings of crops that farmers want to donate to charity

-- Drop table if exists (for easy re-running)
DROP TABLE IF EXISTS crop_donations CASCADE;

-- Create crop_donations table
CREATE TABLE crop_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kilograms' CHECK (unit IN ('kilograms', 'quintals', 'tons', 'liters', 'pieces')),
    description TEXT,
    contact_number TEXT NOT NULL,
    expiry_date DATE,
    pickup_location TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'donated', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_crop_donations_farmer_id ON crop_donations(farmer_id);
CREATE INDEX idx_crop_donations_status ON crop_donations(status);

-- Enable RLS
ALTER TABLE crop_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Farmers can view their own donations
CREATE POLICY "Farmers can view own crop donations"
    ON crop_donations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = farmer_id);

-- Farmers can insert their own donations
CREATE POLICY "Farmers can insert own crop donations"
    ON crop_donations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = farmer_id);

-- Farmers can update their own donations
CREATE POLICY "Farmers can update own crop donations"
    ON crop_donations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = farmer_id)
    WITH CHECK (auth.uid() = farmer_id);

-- Farmers can delete their own donations
CREATE POLICY "Farmers can delete own crop donations"
    ON crop_donations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = farmer_id);

