-- Update orders table to ensure status constraint allows pending, confirmed, cancelled, processing, shipped, delivered
-- This ensures farmers can accept (confirmed) or reject (cancelled) pending orders

-- First, drop the existing constraint if it exists
DO $$
BEGIN
    -- Check if orders table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
        
        -- Add new constraint with all required statuses
        ALTER TABLE orders ADD CONSTRAINT orders_status_check 
            CHECK (status IN ('pending', 'confirmed', 'cancelled', 'processing', 'shipped', 'delivered'));
    END IF;
END $$;

