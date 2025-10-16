-- Migration: Remove Foreign Key Constraint from event_members
-- This allows event_members.user_id to reference both:
-- - profiles.id (authenticated users)
-- - anonymous_profiles.id (anonymous users)

-- PostgreSQL doesn't support multiple foreign key targets, so we remove the constraint
-- and rely on application-level validation and RLS policies for data integrity

-- ============================================================================
-- REMOVE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Remove foreign key constraint on event_members.user_id
-- (May be named room_members_user_id_fkey or event_members_user_id_fkey)
DO $$
BEGIN
  -- Try to drop old room_members constraint name
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'room_members_user_id_fkey'
    AND table_name = 'event_members'
  ) THEN
    ALTER TABLE event_members DROP CONSTRAINT room_members_user_id_fkey;
    RAISE NOTICE '✅ Dropped constraint: room_members_user_id_fkey';
  END IF;

  -- Try to drop new event_members constraint name
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_members_user_id_fkey'
    AND table_name = 'event_members'
  ) THEN
    ALTER TABLE event_members DROP CONSTRAINT event_members_user_id_fkey;
    RAISE NOTICE '✅ Dropped constraint: event_members_user_id_fkey';
  END IF;

  -- If neither existed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name IN ('room_members_user_id_fkey', 'event_members_user_id_fkey')
    AND table_name = 'event_members'
  ) THEN
    RAISE NOTICE '⚠️  No user_id foreign key constraint found on event_members (may already be removed)';
  END IF;
END $$;

-- ============================================================================
-- REMOVE FOREIGN KEY CONSTRAINTS FROM OTHER TABLES
-- ============================================================================

-- Remove foreign key constraint on messages.user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_user_id_fkey'
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT messages_user_id_fkey;
    RAISE NOTICE '✅ Dropped constraint: messages_user_id_fkey from messages table';
  ELSE
    RAISE NOTICE '⚠️  No user_id foreign key constraint found on messages';
  END IF;
END $$;

-- Remove foreign key constraint on user_activity.user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_activity'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'user_activity_user_id_fkey'
      AND table_name = 'user_activity'
    ) THEN
      ALTER TABLE user_activity DROP CONSTRAINT user_activity_user_id_fkey;
      RAISE NOTICE '✅ Dropped constraint: user_activity_user_id_fkey from user_activity table';
    ELSE
      RAISE NOTICE '⚠️  No user_id foreign key constraint found on user_activity';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  user_activity table does not exist';
  END IF;
END $$;

-- Remove foreign key constraint on presence.user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'presence_user_id_fkey'
    AND table_name = 'presence'
  ) THEN
    ALTER TABLE presence DROP CONSTRAINT presence_user_id_fkey;
    RAISE NOTICE '✅ Dropped constraint: presence_user_id_fkey from presence table';
  ELSE
    RAISE NOTICE '⚠️  No user_id foreign key constraint found on presence';
  END IF;
END $$;

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON COLUMN event_members.user_id IS 
  'User ID - can reference either profiles.id (authenticated) or anonymous_profiles.id (anonymous). No FK constraint to support both.';

COMMENT ON COLUMN messages.user_id IS 
  'User ID - can reference either profiles.id (authenticated) or anonymous_profiles.id (anonymous). No FK constraint to support both.';

COMMENT ON COLUMN presence.user_id IS 
  'User ID - can reference either profiles.id (authenticated) or anonymous_profiles.id (anonymous). No FK constraint to support both.';

-- ============================================================================
-- VALIDATION NOTES
-- ============================================================================

-- IMPORTANT: Data integrity is now enforced by:
-- 1. RLS Policies - Control who can insert/update/delete
-- 2. Application Layer - useCurrentUser() provides correct user_id
-- 3. UUID Validation - user_id must be valid UUID format
--
-- The trade-off:
-- ✅ Allows both authenticated and anonymous users
-- ⚠️  No database-level referential integrity for user_id
-- ⚠️  Orphaned records possible if user deleted (but acceptable for this use case)

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that constraints were removed
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE constraint_name LIKE '%user_id_fkey'
  AND table_name IN ('event_members', 'messages', 'presence', 'user_activity');
  
  IF constraint_count = 0 THEN
    RAISE NOTICE '========================================================';
    RAISE NOTICE '✅ SUCCESS: All user_id foreign key constraints removed';
    RAISE NOTICE '========================================================';
  ELSE
    RAISE NOTICE '========================================================';
    RAISE NOTICE '⚠️  WARNING: % user_id foreign key constraints still exist', constraint_count;
    RAISE NOTICE '========================================================';
  END IF;
END $$;

-- List remaining foreign key constraints for verification
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('event_members', 'messages', 'presence', 'user_activity')
ORDER BY tc.table_name, tc.constraint_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '✅ Migration complete: Foreign key constraints removed';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  - event_members.user_id (no FK constraint)';
  RAISE NOTICE '  - messages.user_id (no FK constraint)';
  RAISE NOTICE '  - presence.user_id (no FK constraint)';
  RAISE NOTICE '  - user_activity.user_id (no FK constraint if exists)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Data integrity now enforced by:';
  RAISE NOTICE '  1. RLS Policies';
  RAISE NOTICE '  2. Application layer validation';
  RAISE NOTICE '  3. UUID format validation';
  RAISE NOTICE '========================================================';
END $$;
