-- Update user_profiles to store interests as JSON
-- Run this SQL in your Supabase SQL Editor
-- This will drop and recreate the interests column as JSONB

-- Drop policies related to user_interests if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_interests') THEN
        DROP POLICY IF EXISTS "Users can view own interests" ON user_interests;
        DROP POLICY IF EXISTS "Users can insert own interests" ON user_interests;
        DROP POLICY IF EXISTS "Users can update own interests" ON user_interests;
        DROP POLICY IF EXISTS "Users can delete own interests" ON user_interests;
    END IF;
END $$;

-- Drop the old user_interests table if it exists
DROP TABLE IF EXISTS user_interests CASCADE;

-- Drop the old interests column if it exists (as TEXT[])
ALTER TABLE user_profiles DROP COLUMN IF EXISTS interests;

-- Drop the old index if it exists
DROP INDEX IF EXISTS idx_user_interests_user_id;
DROP INDEX IF EXISTS idx_user_profiles_interests;

-- Add interests column as JSONB to store interests as JSON array
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb;

-- Create index on interests for faster queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_user_profiles_interests ON user_profiles USING GIN (interests);

-- Verify the column was added
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' AND column_name = 'interests';

