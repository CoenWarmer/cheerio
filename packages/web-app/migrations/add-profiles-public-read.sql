-- Migration: Allow Public Read Access to Profiles Table
-- This allows anonymous users to see profile information (display names, avatars)
-- which is needed for chat, member lists, activity feeds, etc.

-- Drop existing authenticated-only SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Allow anyone (authenticated or anonymous) to view profiles
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO public
  USING (true);

-- Keep existing policies for write operations (INSERT/UPDATE/DELETE)
-- These should remain authenticated-only

-- Add comment
COMMENT ON POLICY "Anyone can view profiles" ON profiles IS 
  'Allows both authenticated and anonymous users to view all profiles. This is needed for displaying usernames, avatars, etc. in chat and other features.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================================';
  RAISE NOTICE '✅ Profiles table RLS policy updated';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Anyone can now view profiles (SELECT)';
  RAISE NOTICE 'Write operations still require authentication';
  RAISE NOTICE '========================================================';
END $$;
