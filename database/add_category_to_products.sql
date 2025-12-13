-- Add Category Column to Products Table
-- Run this SQL in your Supabase SQL Editor

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN category TEXT DEFAULT 'grain' 
        CHECK (category IN ('grain', 'vegetable', 'fruit', 'livestock', 'cash crop', 'spice and herb', 'fish'));
    ELSE
        -- If column exists, update the constraint
        ALTER TABLE products 
        DROP CONSTRAINT IF EXISTS products_category_check;
        
        ALTER TABLE products 
        ADD CONSTRAINT products_category_check 
        CHECK (category IN ('grain', 'vegetable', 'fruit', 'livestock', 'cash crop', 'spice and herb', 'fish'));
    END IF;
END $$;

-- Update existing products to have a default category if they don't have one
UPDATE products 
SET category = 'grain' 
WHERE category IS NULL;

-- Make category NOT NULL after setting defaults
ALTER TABLE products 
ALTER COLUMN category SET NOT NULL;

