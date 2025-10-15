-- Fix presence table foreign key constraint
-- The constraint name still references "room_id" even though the column is "event_id"

DO $$
BEGIN
    -- Drop the old constraint with wrong name
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'presence_room_id_fkey'
    ) THEN
        ALTER TABLE presence DROP CONSTRAINT presence_room_id_fkey;
        RAISE NOTICE '✓ Dropped presence_room_id_fkey constraint';
    END IF;
    
    -- Add new constraint with correct name
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'presence_event_id_fkey'
    ) THEN
        ALTER TABLE presence
          ADD CONSTRAINT presence_event_id_fkey
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE '✓ Added presence_event_id_fkey constraint';
    END IF;
END $$;

-- Check if presence table has room_id column that needs renaming
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'presence' 
        AND column_name = 'room_id'
    ) THEN
        ALTER TABLE presence RENAME COLUMN room_id TO event_id;
        RAISE NOTICE '✓ Renamed room_id to event_id in presence table';
    ELSE
        RAISE NOTICE '→ Presence table already has event_id column';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Presence table foreign key updated';
END $$;
