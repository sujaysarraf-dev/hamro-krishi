-- Add Orders Table for Cart and Order Management
-- Run this SQL in your Supabase SQL Editor

-- Drop table if exists
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_address TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for orders
-- Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders"
    ON orders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (for status updates)
CREATE POLICY "Users can update own orders"
    ON orders
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Farmers can view orders for their products (using a function to avoid recursion)
CREATE OR REPLACE FUNCTION check_farmer_order_access(order_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = order_uuid AND p.farmer_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Farmers can view orders for their products"
    ON orders
    FOR SELECT
    USING (check_farmer_order_access(id));

-- Farmers can update orders for their products (status updates)
CREATE POLICY "Farmers can update orders for their products"
    ON orders
    FOR UPDATE
    USING (check_farmer_order_access(id))
    WITH CHECK (check_farmer_order_access(id));

-- Create RLS Policies for order_items
-- Users can view order items for their orders
CREATE POLICY "Users can view own order items"
    ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
        )
    );

-- Users can insert order items for their orders
CREATE POLICY "Users can insert own order items"
    ON order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
        )
    );

-- Farmers can view order items for orders containing their products
CREATE POLICY "Farmers can view order items for their products"
    ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = order_items.product_id AND products.farmer_id = auth.uid()
        )
    );

-- Create trigger for updated_at on orders
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

