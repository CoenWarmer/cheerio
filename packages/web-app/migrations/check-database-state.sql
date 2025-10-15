-- Diagnostic query: Check current database state
-- Run this first to see what tables and columns exist

-- Check what tables exist
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
  AND (tablename LIKE '%room%' OR tablename LIKE '%event%')
ORDER BY tablename;

-- Check columns in messages table (to see if it has room_id or event_id)
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'messages'
  AND (column_name LIKE '%room%' OR column_name LIKE '%event%')
ORDER BY column_name;

-- Check all your public tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
