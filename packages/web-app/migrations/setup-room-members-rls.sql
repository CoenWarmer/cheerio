-- Enable Row Level Security on room_members table
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all room members" ON room_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON room_members;
DROP POLICY IF EXISTS "Users can delete themselves from rooms" ON room_members;

-- Allow authenticated users to view ALL room members
-- (This is needed so users can see who else is in the room)
CREATE POLICY "Users can view all room members"
ON room_members
FOR SELECT
TO authenticated
USING (true);

-- Allow users to join rooms (insert themselves as members)
CREATE POLICY "Users can insert themselves as members"
ON room_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to leave rooms (delete themselves)
CREATE POLICY "Users can delete themselves from rooms"
ON room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON room_members TO authenticated;

