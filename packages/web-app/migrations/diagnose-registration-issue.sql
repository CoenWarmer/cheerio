-- Diagnostic script to check database state and fix registration issues
-- Run this in Supabase SQL Editor to diagnose and fix the problem

-- ===== STEP 1: Check if profiles table exists =====
SELECT 
    'Profiles table' as check_name,
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- ===== STEP 2: Check profiles table structure =====
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ===== STEP 3: Check if trigger function exists =====
SELECT 
    'handle_new_user() function' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
        )
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- ===== STEP 4: Check if trigger exists on auth.users =====
SELECT 
    'on_auth_user_created trigger' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'auth' 
                AND c.relname = 'users' 
                AND t.tgname = 'on_auth_user_created'
        )
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- ===== STEP 5: View current trigger function definition (if it exists) =====
SELECT 
    'Current trigger function' as info,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

-- ===== INSTRUCTIONS =====
-- After running this diagnostic script, look at the results:
-- 
-- 1. If profiles table is MISSING:
--    You need to create the profiles table first
--
-- 2. If display_name column shows is_nullable = 'NO':
--    This is the problem! Continue to the fix below.
--
-- 3. If trigger function or trigger is MISSING:
--    You need to create them (included in fix below)
--
-- 4. If everything exists but display_name is NOT NULL:
--    Run the fix script below

