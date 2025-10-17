-- Migration: Consolidate anonymous_profiles into profiles table
-- This allows us to use foreign keys and simplifies the data model

-- ============================================================================
-- STEP 1: Add is_anonymous column to profiles
-- ============================================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_anonymous ON profiles(is_anonymous);

-- ============================================================================
-- STEP 2: Migrate data from anonymous_profiles to profiles
-- ============================================================================

INSERT INTO profiles (id, display_name, is_anonymous, created_at, avatar_url)
SELECT 
  id,
  display_name,
  true as is_anonymous,
  created_at,
  null as avatar_url
FROM anonymous_profiles
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Add foreign key constraints (NOW POSSIBLE!)
-- ============================================================================

-- Messages
ALTER TABLE messages 
ADD CONSTRAINT messages_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Event members
ALTER TABLE event_members
ADD CONSTRAINT event_members_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Presence
ALTER TABLE presence
ADD CONSTRAINT presence_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- User activity
ALTER TABLE user_activity
ADD CONSTRAINT user_activity_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- ============================================================================
-- STEP 4: Add indexes for better performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_event_members_user_id ON event_members(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_user_id ON presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);

-- ============================================================================
-- STEP 5: Drop anonymous_profiles table (after verifying migration)
-- ============================================================================

-- Uncomment after verifying everything works:
-- DROP TABLE IF EXISTS anonymous_profiles CASCADE;

-- ============================================================================
-- SUCCESS
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Profiles consolidated successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update application code to use profiles table for all users';
    RAISE NOTICE '  2. Verify all features work for both user types';
    RAISE NOTICE '  3. Uncomment and run DROP TABLE anonymous_profiles';
END $$;

