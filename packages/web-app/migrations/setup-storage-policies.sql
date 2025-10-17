-- Setup Storage Policies for room-attachments bucket
-- IMPORTANT: This script must be run by a Supabase admin/service role
-- If you get "must be owner of table objects" error, use the Supabase Dashboard Storage UI instead

-- Method 1: Make the bucket public (simplest solution)
-- This allows read access without authentication
UPDATE storage.buckets 
SET public = true 
WHERE id = 'room-attachments';

-- If the bucket doesn't exist, create it first:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('room-attachments', 'room-attachments', true)
-- ON CONFLICT (id) DO NOTHING;

