-- Add custom_display_name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_display_name TEXT;

-- Update RLS policies to allow users to update their own custom_display_name
CREATE POLICY update_own_custom_display_name ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
