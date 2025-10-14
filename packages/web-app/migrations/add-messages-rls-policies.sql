-- Add RLS policies for messages table
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/oumenpdjtlflmelorrrj/sql

-- Enable RLS on messages table (if not already enabled)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all messages
CREATE POLICY IF NOT EXISTS "Authenticated users can read messages" ON messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create messages (they must be the sender)
CREATE POLICY IF NOT EXISTS "Authenticated users can create messages" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own messages
CREATE POLICY IF NOT EXISTS "Users can update own messages" ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to soft-delete their own messages
CREATE POLICY IF NOT EXISTS "Users can soft-delete own messages" ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND deleted = false)
  WITH CHECK (auth.uid() = user_id);

