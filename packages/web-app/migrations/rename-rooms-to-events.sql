-- Migration: Rename rooms to events
-- This migration renames all room-related tables and columns to use "event" terminology

-- Step 1: Rename the rooms table to events
ALTER TABLE rooms RENAME TO events;

-- Step 2: Rename the room_members table to event_members
ALTER TABLE room_members RENAME TO event_members;

-- Step 3: Rename columns in event_members table
ALTER TABLE event_members RENAME COLUMN room_id TO event_id;

-- Step 4: Rename foreign key constraint
ALTER TABLE event_members 
  DROP CONSTRAINT IF EXISTS room_members_room_id_fkey;

ALTER TABLE event_members
  ADD CONSTRAINT event_members_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Step 5: Rename columns in messages table
ALTER TABLE messages RENAME COLUMN room_id TO event_id;

ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_room_id_fkey;

ALTER TABLE messages
  ADD CONSTRAINT messages_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Step 6: Rename columns in user_activity table
ALTER TABLE user_activity RENAME COLUMN room_id TO event_id;

ALTER TABLE user_activity
  DROP CONSTRAINT IF EXISTS user_activity_room_id_fkey;

ALTER TABLE user_activity
  ADD CONSTRAINT user_activity_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Step 7: Rename indexes
ALTER INDEX IF EXISTS idx_rooms_location RENAME TO idx_events_location;
ALTER INDEX IF EXISTS idx_rooms_created_by RENAME TO idx_events_created_by;
ALTER INDEX IF EXISTS room_members_pkey RENAME TO event_members_pkey;
ALTER INDEX IF EXISTS idx_messages_room_id RENAME TO idx_messages_event_id;
ALTER INDEX IF EXISTS idx_user_activity_room_id RENAME TO idx_user_activity_event_id;

-- Step 8: Update RLS policies for events table
DROP POLICY IF EXISTS "Users can view all rooms" ON events;
DROP POLICY IF EXISTS "Users can create rooms" ON events;
DROP POLICY IF EXISTS "Users can update their own rooms" ON events;
DROP POLICY IF EXISTS "Users can delete their own rooms" ON events;

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

-- Step 9: Update RLS policies for event_members table
DROP POLICY IF EXISTS "Users can view all room members" ON event_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON event_members;
DROP POLICY IF EXISTS "Users can delete themselves from rooms" ON event_members;

CREATE POLICY "Users can view all event members"
  ON event_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert themselves as members"
  ON event_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete themselves from events"
  ON event_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 10: Update comments
COMMENT ON TABLE events IS 'Events/gatherings where users can participate and track activities';
COMMENT ON TABLE event_members IS 'Junction table for event participation';
COMMENT ON COLUMN events.location IS 'Geographic location of the event (WGS84 coordinates)';
COMMENT ON COLUMN event_members.event_id IS 'Foreign key to events table';
COMMENT ON COLUMN messages.event_id IS 'Foreign key to events table';
COMMENT ON COLUMN user_activity.event_id IS 'Foreign key to events table';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Rooms have been renamed to Events';
END $$;
