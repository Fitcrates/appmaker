-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view all ratings" ON user_ratings;
DROP POLICY IF EXISTS "Users can only create their own ratings" ON user_ratings;
DROP POLICY IF EXISTS "Users can only update their own ratings" ON user_ratings;
DROP POLICY IF EXISTS "Users can only delete their own ratings" ON user_ratings;
DROP POLICY IF EXISTS "Users can view their own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can only add to their own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can only update their own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can only delete from their own watchlist" ON user_watchlist;

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') AND auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') AND auth.uid() = id);

-- User ratings policies
CREATE POLICY "Users can view all ratings"
ON user_ratings FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_ratings') AND true);

CREATE POLICY "Users can only create their own ratings"
ON user_ratings FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_ratings') AND auth.uid() = user_id);

CREATE POLICY "Users can only update their own ratings"
ON user_ratings FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_ratings') AND auth.uid() = user_id);

CREATE POLICY "Users can only delete their own ratings"
ON user_ratings FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_ratings') AND auth.uid() = user_id);

-- User watchlist policies
CREATE POLICY "Users can view their own watchlist"
ON user_watchlist FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_watchlist') AND auth.uid() = user_id);

CREATE POLICY "Users can only add to their own watchlist"
ON user_watchlist FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_watchlist') AND auth.uid() = user_id);

CREATE POLICY "Users can only update their own watchlist"
ON user_watchlist FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_watchlist') AND auth.uid() = user_id);

CREATE POLICY "Users can only delete from their own watchlist"
ON user_watchlist FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_watchlist') AND auth.uid() = user_id);
