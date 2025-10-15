-- Migration: Rename rooms to events (Safe version with checks)
-- This migration renames all room-related tables and columns to use "event" terminology

-- First, let's check what tables exist and adapt accordingly

-- Step 1: Rename the rooms table to events (if rooms exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rooms') THEN
        ALTER TABLE rooms RENAME TO events;
        RAISE NOTICE 'Renamed rooms table to events';
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
        RAISE NOTICE 'Table events already exists, skipping';
    ELSE
        RAISE EXCEPTION 'Neither rooms nor events table found!';
    END IF;
END $$;

-- Step 2: Rename the room_members table to event_members (if room_members exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'room_members') THEN
        ALTER TABLE room_members RENAME TO event_members;
        RAISE NOTICE 'Renamed room_members table to event_members';
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_members') THEN
        RAISE NOTICE 'Table event_members already exists, skipping';
    ELSE
        RAISE EXCEPTION 'Neither room_members nor event_members table found!';
    END IF;
END $$;

-- Step 3: Rename column room_id to event_id in event_members table (if room_id exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_members' 
        AND column_name = 'room_id'
    ) THEN
        ALTER TABLE event_members RENAME COLUMN room_id TO event_id;
        RAISE NOTICE 'Renamed room_id to event_id in event_members';
    ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_members' 
        AND column_name = 'event_id'
    ) THEN
        RAISE NOTICE 'Column event_id already exists in event_members, skipping';
    END IF;
END $$;

-- Step 4: Update foreign key constraint for event_members
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'room_members_room_id_fkey'
    ) THEN
        ALTER TABLE event_members DROP CONSTRAINT room_members_room_id_fkey;
        RAISE NOTICE 'Dropped old room_members_room_id_fkey constraint';
    END IF;
    
    -- Add new constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'event_members_event_id_fkey'
    ) THEN
        ALTER TABLE event_members
          ADD CONSTRAINT event_members_event_id_fkey 
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added event_members_event_id_fkey constraint';
    END IF;
END $$;

-- Step 5: Rename column room_id to event_id in messages table (if room_id exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'room_id'
    ) THEN
        ALTER TABLE messages RENAME COLUMN room_id TO event_id;
        RAISE NOTICE 'Renamed room_id to event_id in messages';
    ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'event_id'
    ) THEN
        RAISE NOTICE 'Column event_id already exists in messages, skipping';
    END IF;
END $$;

-- Step 6: Update foreign key constraint for messages
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_room_id_fkey'
    ) THEN
        ALTER TABLE messages DROP CONSTRAINT messages_room_id_fkey;
        RAISE NOTICE 'Dropped old messages_room_id_fkey constraint';
    END IF;
    
    -- Add new constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_event_id_fkey'
    ) THEN
        ALTER TABLE messages
          ADD CONSTRAINT messages_event_id_fkey
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added messages_event_id_fkey constraint';
    END IF;
END $$;

-- Step 7: Rename column room_id to event_id in user_activity table (if room_id exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_activity' 
        AND column_name = 'room_id'
    ) THEN
        ALTER TABLE user_activity RENAME COLUMN room_id TO event_id;
        RAISE NOTICE 'Renamed room_id to event_id in user_activity';
    ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_activity' 
        AND column_name = 'event_id'
    ) THEN
        RAISE NOTICE 'Column event_id already exists in user_activity, skipping';
    END IF;
END $$;

-- Step 8: Update foreign key constraint for user_activity
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_activity_room_id_fkey'
    ) THEN
        ALTER TABLE user_activity DROP CONSTRAINT user_activity_room_id_fkey;
        RAISE NOTICE 'Dropped old user_activity_room_id_fkey constraint';
    END IF;
    
    -- Add new constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_activity_event_id_fkey'
    ) THEN
        ALTER TABLE user_activity
          ADD CONSTRAINT user_activity_event_id_fkey
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_activity_event_id_fkey constraint';
    END IF;
END $$;

-- Step 9: Rename indexes (with existence checks)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_rooms_location') THEN
        ALTER INDEX idx_rooms_location RENAME TO idx_events_location;
        RAISE NOTICE 'Renamed idx_rooms_location to idx_events_location';
    END IF;
    
    IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_rooms_created_by') THEN
        ALTER INDEX idx_rooms_created_by RENAME TO idx_events_created_by;
        RAISE NOTICE 'Renamed idx_rooms_created_by to idx_events_created_by';
    END IF;
    
    IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'room_members_pkey') THEN
        ALTER INDEX room_members_pkey RENAME TO event_members_pkey;
        RAISE NOTICE 'Renamed room_members_pkey to event_members_pkey';
    END IF;
    
    IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_messages_room_id') THEN
        ALTER INDEX idx_messages_room_id RENAME TO idx_messages_event_id;
        RAISE NOTICE 'Renamed idx_messages_room_id to idx_messages_event_id';
    END IF;
    
    IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_activity_room_id') THEN
        ALTER INDEX idx_user_activity_room_id RENAME TO idx_user_activity_event_id;
        RAISE NOTICE 'Renamed idx_user_activity_room_id to idx_user_activity_event_id';
    END IF;
END $$;

-- Step 10: Update RLS policies for events table
DROP POLICY IF EXISTS "Users can view all rooms" ON events;
DROP POLICY IF EXISTS "Users can create rooms" ON events;
DROP POLICY IF EXISTS "Users can update their own rooms" ON events;
DROP POLICY IF EXISTS "Users can delete their own rooms" ON events;
DROP POLICY IF EXISTS "Users can view all events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

CREATE POLICY "Users can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Step 11: Update RLS policies for event_members table
DROP POLICY IF EXISTS "Users can view all room members" ON event_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON event_members;
DROP POLICY IF EXISTS "Users can delete themselves from rooms" ON event_members;
DROP POLICY IF EXISTS "Users can view all event members" ON event_members;
DROP POLICY IF EXISTS "Users can insert themselves as event members" ON event_members;
DROP POLICY IF EXISTS "Users can delete themselves from events" ON event_members;

CREATE POLICY "Users can view all event members"
  ON event_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert themselves as event members"
  ON event_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete themselves from events"
  ON event_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 12: Update comments
COMMENT ON TABLE events IS 'Events/gatherings where users can participate and track activities';
COMMENT ON TABLE event_members IS 'Junction table for event participation';
COMMENT ON COLUMN events.location IS 'Geographic location of the event (WGS84 coordinates)';
COMMENT ON COLUMN event_members.event_id IS 'Foreign key to events table';
COMMENT ON COLUMN messages.event_id IS 'Foreign key to events table';
COMMENT ON COLUMN user_activity.event_id IS 'Foreign key to events table';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete: Rooms have been renamed to Events';
END $$;
