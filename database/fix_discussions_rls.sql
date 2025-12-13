-- Fix RLS policies for discussions table
-- The issue is that the policy checks user_profiles.role which might have RLS issues
-- We'll use a SECURITY DEFINER function to check the role safely

-- Ensure discussions table exists
CREATE TABLE IF NOT EXISTS discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'crops', 'livestock', 'equipment', 'tips', 'questions')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure discussion_replies table exists
CREATE TABLE IF NOT EXISTS discussion_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on tables
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Farmers can view all discussions" ON discussions;
DROP POLICY IF EXISTS "Farmers can insert own discussions" ON discussions;
DROP POLICY IF EXISTS "Farmers can update own discussions" ON discussions;
DROP POLICY IF EXISTS "Farmers can delete own discussions" ON discussions;

-- Create a SECURITY DEFINER function to check if user is a farmer
-- This bypasses RLS when checking user_profiles
CREATE OR REPLACE FUNCTION public.is_farmer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = user_id AND role = 'farmer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS Policies for discussions
-- Farmers can view all discussions
CREATE POLICY "Farmers can view all discussions"
    ON discussions
    FOR SELECT
    TO authenticated
    USING (public.is_farmer(auth.uid()));

-- Farmers can insert their own discussions
CREATE POLICY "Farmers can insert own discussions"
    ON discussions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        farmer_id = auth.uid() AND 
        public.is_farmer(auth.uid())
    );

-- Farmers can update their own discussions
CREATE POLICY "Farmers can update own discussions"
    ON discussions
    FOR UPDATE
    TO authenticated
    USING (
        farmer_id = auth.uid() AND 
        public.is_farmer(auth.uid())
    )
    WITH CHECK (
        farmer_id = auth.uid() AND 
        public.is_farmer(auth.uid())
    );

-- Farmers can delete their own discussions
CREATE POLICY "Farmers can delete own discussions"
    ON discussions
    FOR DELETE
    TO authenticated
    USING (
        farmer_id = auth.uid() AND 
        public.is_farmer(auth.uid())
    );

-- Fix RLS policies for discussion_replies table
DROP POLICY IF EXISTS "Farmers can view all replies" ON discussion_replies;
DROP POLICY IF EXISTS "Farmers can create replies" ON discussion_replies;
DROP POLICY IF EXISTS "Farmers can update own replies" ON discussion_replies;
DROP POLICY IF EXISTS "Farmers can delete own replies" ON discussion_replies;

-- Create RLS Policies for discussion_replies
-- All farmers can view all replies
CREATE POLICY "Farmers can view all replies"
    ON discussion_replies
    FOR SELECT
    TO authenticated
    USING (public.is_farmer(auth.uid()));

-- Farmers can create replies
CREATE POLICY "Farmers can create replies"
    ON discussion_replies
    FOR INSERT
    TO authenticated
    WITH CHECK (
        farmer_id = auth.uid() AND 
        public.is_farmer(auth.uid())
    );

-- Farmers can update their own replies
CREATE POLICY "Farmers can update own replies"
    ON discussion_replies
    FOR UPDATE
    TO authenticated
    USING (
        farmer_id = auth.uid() AND 
        public.is_farmer(auth.uid())
    )
    WITH CHECK (
        farmer_id = auth.uid() AND 
        public.is_farmer(auth.uid())
    );

-- Farmers can delete their own replies
CREATE POLICY "Farmers can delete own replies"
    ON discussion_replies
    FOR DELETE
    TO authenticated
    USING (
        farmer_id = auth.uid() AND 
        public.is_farmer(auth.uid())
    );

