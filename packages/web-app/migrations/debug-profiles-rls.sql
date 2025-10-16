-- Debug: Check profiles table RLS policies
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled on profiles
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Check RLS policies on profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Try to select as anonymous user (simulates API without auth)
SET ROLE anon;
SELECT id, display_name, avatar_url, permissions 
FROM profiles 
WHERE id IN (
  '8d892bcb-9dc2-48a0-90d0-c2027ffd425e',
  'e3d58d04-24d4-4ebe-8170-c047cc2917c4'
);
RESET ROLE;

-- 4. Try to select as authenticated user
SET ROLE authenticated;
SELECT id, display_name, avatar_url, permissions 
FROM profiles 
WHERE id IN (
  '8d892bcb-9dc2-48a0-90d0-c2027ffd425e',
  'e3d58d04-24d4-4ebe-8170-c047cc2917c4'
);
RESET ROLE;
