-- Quick Fix: Add Presence Table RLS Policies for Anonymous Users
-- This is a standalone fix that can be run separately if you've already
-- run add-anonymous-user-support.sql without presence policies

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can view presence" ON presence;
DROP POLICY IF EXISTS "Authenticated users can create presence" ON presence;
DROP POLICY IF EXISTS "Users can update own presence" ON presence;
DROP POLICY IF EXISTS "Users can delete own presence" ON presence;

-- Allow anyone to view presence
CREATE POLICY "Anyone can view presence"
  ON presence FOR SELECT
  TO public
  USING (true);

-- Allow anyone to create presence records
-- Note: The app layer should ensure user_id matches either:
-- - auth.uid() for authenticated users
-- - their anonymous_profile.id for anonymous users
CREATE POLICY "Anyone can create presence"
  ON presence FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to update presence records
-- Note: Typically used for upsert operations
CREATE POLICY "Anyone can update presence"
  ON presence FOR UPDATE
  TO public
  USING (true);

-- Allow anyone to delete presence records
CREATE POLICY "Anyone can delete presence"
  ON presence FOR DELETE
  TO public
  USING (true);

-- Add comments
COMMENT ON POLICY "Anyone can view presence" ON presence IS 
  'Allows both authenticated and anonymous users to see who is active in events';

COMMENT ON POLICY "Anyone can create presence" ON presence IS 
  'Allows both authenticated users (auth.uid) and anonymous users (anonymous_profiles.id) to create presence records. Application layer validates user_id ownership.';

COMMENT ON POLICY "Anyone can update presence" ON presence IS 
  'Allows presence updates for upsert operations by both authenticated and anonymous users';

COMMENT ON POLICY "Anyone can delete presence" ON presence IS 
  'Allows both authenticated and anonymous users to remove their presence records';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================================';
  RAISE NOTICE '✅ Presence table RLS policies updated';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Anonymous users can now:';
  RAISE NOTICE '  - View presence (SELECT)';
  RAISE NOTICE '  - Create presence records (INSERT)';
  RAISE NOTICE '  - Update presence records (UPDATE)';
  RAISE NOTICE '  - Delete presence records (DELETE)';
  RAISE NOTICE '========================================================';
END $$;
