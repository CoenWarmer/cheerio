-- Debug: Check anonymous_profiles table and data
-- Run this in Supabase SQL Editor to troubleshoot

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'anonymous_profiles'
) as table_exists;

-- 2. Count rows in anonymous_profiles
SELECT COUNT(*) as row_count FROM anonymous_profiles;

-- 3. Show all anonymous profiles
SELECT * FROM anonymous_profiles ORDER BY created_at DESC LIMIT 10;

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'anonymous_profiles';

-- 5. Check if specific IDs exist
SELECT * FROM anonymous_profiles 
WHERE id IN (
  '8d892bcb-9dc2-48a0-90d0-c2027ffd425e',
  'e3d58d04-24d4-4ebe-8170-c047cc2917c4'
);

-- 6. Try to select as anonymous user (simulates public access)
SET ROLE anon;
SELECT * FROM anonymous_profiles LIMIT 5;
RESET ROLE;
