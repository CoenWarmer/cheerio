-- Create user_activity table for tracking historical user activities in rooms
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'location', 'speed', 'distance', 'music', etc.
  data JSONB NOT NULL, -- Flexible JSON for different activity types
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_activity_room_user ON user_activity(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert their own activity
CREATE POLICY "Users can insert own activity" ON user_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: All authenticated users can read activity in rooms
-- (Since activities are meant to be public in the room)
CREATE POLICY "Authenticated users can read activity" ON user_activity
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can update their own activity
CREATE POLICY "Users can update own activity" ON user_activity
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own activity
CREATE POLICY "Users can delete own activity" ON user_activity
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

