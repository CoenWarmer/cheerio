-- Create anonymous_profiles table for users who don't want to register
-- This allows anonymous users to participate with just a display name

-- ===== Create the table =====
CREATE TABLE IF NOT EXISTS public.anonymous_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ===== Add indexes =====
CREATE INDEX IF NOT EXISTS idx_anonymous_profiles_created_at 
  ON public.anonymous_profiles(created_at);

-- ===== Enable Row Level Security =====
ALTER TABLE public.anonymous_profiles ENABLE ROW LEVEL SECURITY;

-- ===== RLS Policies =====

-- Anyone can read anonymous profiles (needed for displaying usernames in chat, etc.)
CREATE POLICY "Anyone can read anonymous profiles"
  ON public.anonymous_profiles
  FOR SELECT
  TO public
  USING (true);

-- Anyone can insert a new anonymous profile (for first-time visitors)
CREATE POLICY "Anyone can create anonymous profile"
  ON public.anonymous_profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can only update their own anonymous profile
-- Note: We'll use a custom header or function to verify ownership
CREATE POLICY "Users can update own anonymous profile"
  ON public.anonymous_profiles
  FOR UPDATE
  TO public
  USING (true)  -- Will be enforced in application code via UUID matching
  WITH CHECK (true);

-- Users can delete their own anonymous profile
CREATE POLICY "Users can delete own anonymous profile"
  ON public.anonymous_profiles
  FOR DELETE
  TO public
  USING (true);  -- Will be enforced in application code via UUID matching

-- ===== Update timestamp trigger =====
CREATE OR REPLACE FUNCTION update_anonymous_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_anonymous_profile_updated_at
  BEFORE UPDATE ON public.anonymous_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_anonymous_profile_updated_at();

-- ===== Grant permissions =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anonymous_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anonymous_profiles TO authenticated;

-- ===== Success message =====
DO $$ 
BEGIN
    RAISE NOTICE '✅ Anonymous profiles table created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  - UUID-based identification (stored in browser)';
    RAISE NOTICE '  - Display name required';
    RAISE NOTICE '  - Automatic timestamps';
    RAISE NOTICE '  - RLS enabled with public read access';
    RAISE NOTICE '  - Anyone can create/update (ownership checked in app)';
END $$;
