-- Add location field to messages table
-- This stores the user's location at the time they sent the message (if tracking)
-- Format: { "lat": number, "long": number }

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS location JSONB;

-- Add a comment to document the column
COMMENT ON COLUMN messages.location IS 'User location when message was sent (if tracking). Format: { "lat": number, "long": number }';

