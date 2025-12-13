-- Add organic certification fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_organic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS organic_certification_number TEXT,
ADD COLUMN IF NOT EXISTS organic_certification_authority TEXT,
ADD COLUMN IF NOT EXISTS organic_certification_date DATE;

-- Create index for organic products
CREATE INDEX IF NOT EXISTS idx_products_is_organic ON products(is_organic);

-- Add comment
COMMENT ON COLUMN products.is_organic IS 'Whether the product is certified organic';
COMMENT ON COLUMN products.organic_certification_number IS 'Organic certification number';
COMMENT ON COLUMN products.organic_certification_authority IS 'Certifying authority (e.g., USDA, EU Organic)';
COMMENT ON COLUMN products.organic_certification_date IS 'Date of organic certification';

