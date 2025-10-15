-- Migration: Rename room_id columns to event_id
-- Tables are already named correctly (events, event_members)
-- This just renames the remaining room_id columns

-- Step 1: Rename column room_id to event_id in event_members table (if room_id exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_members' 
        AND column_name = 'room_id'
    ) THEN
        ALTER TABLE event_members RENAME COLUMN room_id TO event_id;
        RAISE NOTICE '✓ Renamed room_id to event_id in event_members';
    ELSE
        RAISE NOTICE '→ Column event_id already exists in event_members or room_id not found';
    END IF;
END $$;

-- Step 2: Rename column room_id to event_id in messages table (if room_id exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'room_id'
    ) THEN
        ALTER TABLE messages RENAME COLUMN room_id TO event_id;
        RAISE NOTICE '✓ Renamed room_id to event_id in messages';
    ELSE
        RAISE NOTICE '→ Column event_id already exists in messages or room_id not found';
    END IF;
END $$;

-- Step 3: Rename column room_id to event_id in user_activity table (if room_id exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_activity' 
        AND column_name = 'room_id'
    ) THEN
        ALTER TABLE user_activity RENAME COLUMN room_id TO event_id;
        RAISE NOTICE '✓ Renamed room_id to event_id in user_activity';
    ELSE
        RAISE NOTICE '→ Column event_id already exists in user_activity or room_id not found';
    END IF;
END $$;

-- Step 4: Update foreign key constraints
DO $$
BEGIN
    -- Drop old constraints if they exist
    IF EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'event_members_room_id_fkey') THEN
        ALTER TABLE event_members DROP CONSTRAINT event_members_room_id_fkey;
        RAISE NOTICE '✓ Dropped event_members_room_id_fkey constraint';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'messages_room_id_fkey') THEN
        ALTER TABLE messages DROP CONSTRAINT messages_room_id_fkey;
        RAISE NOTICE '✓ Dropped messages_room_id_fkey constraint';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'user_activity_room_id_fkey') THEN
        ALTER TABLE user_activity DROP CONSTRAINT user_activity_room_id_fkey;
        RAISE NOTICE '✓ Dropped user_activity_room_id_fkey constraint';
    END IF;
    
    -- Add new constraints if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'event_members_event_id_fkey') THEN
        ALTER TABLE event_members
          ADD CONSTRAINT event_members_event_id_fkey 
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE '✓ Added event_members_event_id_fkey constraint';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'messages_event_id_fkey') THEN
        ALTER TABLE messages
          ADD CONSTRAINT messages_event_id_fkey
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE '✓ Added messages_event_id_fkey constraint';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'user_activity_event_id_fkey') THEN
        ALTER TABLE user_activity
          ADD CONSTRAINT user_activity_event_id_fkey
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE '✓ Added user_activity_event_id_fkey constraint';
    END IF;
END $$;

-- Step 5: Rename indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_messages_room_id') THEN
        ALTER INDEX idx_messages_room_id RENAME TO idx_messages_event_id;
        RAISE NOTICE '✓ Renamed idx_messages_room_id to idx_messages_event_id';
    END IF;
    
    IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_activity_room_id') THEN
        ALTER INDEX idx_user_activity_room_id RENAME TO idx_user_activity_event_id;
        RAISE NOTICE '✓ Renamed idx_user_activity_room_id to idx_user_activity_event_id';
    END IF;
END $$;

-- Step 6: Update comments
DO $$
BEGIN
    COMMENT ON COLUMN event_members.event_id IS 'Foreign key to events table';
    COMMENT ON COLUMN messages.event_id IS 'Foreign key to events table';
    COMMENT ON COLUMN user_activity.event_id IS 'Foreign key to events table';
    RAISE NOTICE '✓ Updated column comments';
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration complete: All room_id columns renamed to event_id';
  RAISE NOTICE '';
END $$;
