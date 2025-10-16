-- Migration: Add Anonymous User Support to Events, Event Members, and Messages
-- This allows anonymous users (stored in anonymous_profiles table) to:
-- - View events
-- - Join events
-- - Send and read messages

-- ============================================================================
-- EVENTS TABLE - Allow public read access
-- ============================================================================

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Users can view all events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- Allow anyone (authenticated or anonymous) to view events
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to create events
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow authenticated users to update their own events
CREATE POLICY "Authenticated users can update their own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Allow authenticated users to delete their own events
CREATE POLICY "Authenticated users can delete their own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- ============================================================================
-- EVENT_MEMBERS TABLE - Allow public access for joining
-- ============================================================================

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Users can view all event members" ON event_members;
DROP POLICY IF EXISTS "Users can insert themselves as event members" ON event_members;
DROP POLICY IF EXISTS "Users can delete themselves from events" ON event_members;

-- Allow anyone to view event members
CREATE POLICY "Anyone can view event members"
  ON event_members FOR SELECT
  TO public
  USING (true);

-- Allow anyone to join events (both authenticated and anonymous users)
-- Note: The app layer should validate that the user_id matches either:
-- - auth.uid() for authenticated users
-- - their anonymous_profile.id for anonymous users
CREATE POLICY "Anyone can join events"
  ON event_members FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to remove themselves from events
CREATE POLICY "Anyone can leave events"
  ON event_members FOR DELETE
  TO public
  USING (true);

-- ============================================================================
-- MESSAGES TABLE - Allow public access for chat
-- ============================================================================

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can read messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can soft-delete own messages" ON messages;

-- Allow anyone to read messages
CREATE POLICY "Anyone can read messages"
  ON messages FOR SELECT
  TO public
  USING (true);

-- Allow anyone to create messages
-- Note: The app layer should ensure user_id matches either:
-- - auth.uid() for authenticated users
-- - their anonymous_profile.id for anonymous users
CREATE POLICY "Anyone can create messages"
  ON messages FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to update their own messages
-- Note: The app layer should validate ownership
CREATE POLICY "Anyone can update their own messages"
  ON messages FOR UPDATE
  TO public
  USING (true);

-- Allow soft-delete of messages
CREATE POLICY "Anyone can soft-delete messages"
  ON messages FOR UPDATE
  TO public
  USING (deleted = false)
  WITH CHECK (true);

-- ============================================================================
-- USER_ACTIVITY TABLE - Allow public access for activity tracking
-- ============================================================================

-- Check if user_activity table exists and add policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_activity') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Authenticated users can view activity" ON user_activity;
    DROP POLICY IF EXISTS "Authenticated users can create activity" ON user_activity;
    DROP POLICY IF EXISTS "Users can update own activity" ON user_activity;
    
    -- Allow anyone to view activity
    EXECUTE 'CREATE POLICY "Anyone can view activity"
      ON user_activity FOR SELECT
      TO public
      USING (true)';
    
    -- Allow anyone to create activity records
    EXECUTE 'CREATE POLICY "Anyone can create activity"
      ON user_activity FOR INSERT
      TO public
      WITH CHECK (true)';
    
    -- Allow anyone to update their own activity
    EXECUTE 'CREATE POLICY "Anyone can update activity"
      ON user_activity FOR UPDATE
      TO public
      USING (true)';
    
    RAISE NOTICE '✅ Updated user_activity policies for anonymous support';
  ELSE
    RAISE NOTICE '⚠️  user_activity table does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- PRESENCE TABLE - Allow public access for presence tracking
-- ============================================================================

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

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Anyone can view events" ON events IS 
  'Allows both authenticated and anonymous users to view all events';

COMMENT ON POLICY "Anyone can view event members" ON event_members IS 
  'Allows both authenticated and anonymous users to see who joined events';

COMMENT ON POLICY "Anyone can join events" ON event_members IS 
  'Allows both authenticated users (auth.uid) and anonymous users (anonymous_profiles.id) to join events. Application layer validates user_id ownership.';

COMMENT ON POLICY "Anyone can read messages" ON messages IS 
  'Allows both authenticated and anonymous users to read all messages in events';

COMMENT ON POLICY "Anyone can create messages" ON messages IS 
  'Allows both authenticated users (auth.uid) and anonymous users (anonymous_profiles.id) to send messages. Application layer validates user_id ownership.';

COMMENT ON POLICY "Anyone can view presence" ON presence IS 
  'Allows both authenticated and anonymous users to see who is active in events';

COMMENT ON POLICY "Anyone can create presence" ON presence IS 
  'Allows both authenticated users (auth.uid) and anonymous users (anonymous_profiles.id) to create presence records. Application layer validates user_id ownership.';

COMMENT ON POLICY "Anyone can update presence" ON presence IS 
  'Allows presence updates for upsert operations by both authenticated and anonymous users';

COMMENT ON POLICY "Anyone can delete presence" ON presence IS 
  'Allows both authenticated and anonymous users to remove their presence records';

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- IMPORTANT: These policies allow public access (TO public) which includes
-- both authenticated users and anonymous connections. The application layer
-- MUST validate that:
--
-- 1. For authenticated users: user_id = auth.uid()
-- 2. For anonymous users: user_id = their anonymous_profiles.id stored in localStorage
--
-- This is enforced in the frontend through:
-- - useCurrentUser hook that provides the correct user_id
-- - API calls that use the appropriate ID based on authentication state
--
-- The trade-off is:
-- ✅ Allows anonymous users to participate without accounts
-- ⚠️  Requires application-layer validation instead of database-layer enforcement
-- ⚠️  Anonymous users cannot access their data from different devices

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================================';
  RAISE NOTICE '✅ Migration complete: Anonymous user support enabled';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  - events (public read access)';
  RAISE NOTICE '  - event_members (public join/leave access)';
  RAISE NOTICE '  - messages (public read/write access)';
  RAISE NOTICE '  - presence (public read/write access)';
  RAISE NOTICE '  - user_activity (public access if exists)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Application layer must validate user ownership';
  RAISE NOTICE '========================================================';
END $$;
