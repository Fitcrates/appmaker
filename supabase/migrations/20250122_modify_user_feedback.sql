-- Drop existing table
drop table if exists public.user_feedback;

-- Create new table with rating
create table public.user_feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  anime_id bigint not null,
  rating numeric(3,1) not null check (rating >= 0 AND rating <= 10),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  unique(user_id, anime_id)
);

-- Drop existing triggers first
DROP TRIGGER IF EXISTS user_feedback_updated_at ON public.user_feedback;
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Modify user_feedback table
ALTER TABLE public.user_feedback 
DROP COLUMN IF EXISTS liked CASCADE;

-- Create function for updating timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER user_feedback_updated_at
    BEFORE UPDATE ON public.user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.user_feedback;

-- Create RLS policies
CREATE POLICY "Enable read access for own feedback" 
    ON public.user_feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for own feedback"
    ON public.user_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for own feedback"
    ON public.user_feedback
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for own feedback"
    ON public.user_feedback
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.user_feedback TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
