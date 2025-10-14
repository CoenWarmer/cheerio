-- Migration to update the rooms table with required fields
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT_ID/sql

-- First, let's check if we need to rename 'name' to 'title'
-- If your table has 'name', uncomment this line:
-- ALTER TABLE rooms RENAME COLUMN name TO title;

-- If you don't have a 'title' column yet and need to add it:
-- ALTER TABLE rooms ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';

-- Add donation_link column
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS donation_link TEXT;

-- Add start_time column
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;

-- Create enum type for status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE room_status AS ENUM ('awaiting', 'in_progress', 'finished');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column with enum type
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS status room_status DEFAULT 'awaiting';

-- Optional: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_start_time ON rooms(start_time);

-- Optional: Add a comment to the table
COMMENT ON TABLE rooms IS 'Stores room information with title, description, donation link, start time, and status';

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rooms'
ORDER BY ordinal_position;

