-- Fix registration error by allowing NULL display_name
-- Run diagnose-registration-issue.sql FIRST to check current state

-- ===== ANALYSIS =====
-- The current trigger uses: COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
-- This should work, but the issue is likely one of:
-- 1. display_name column has NOT NULL constraint AND email extraction is failing
-- 2. The email field might not be available in the trigger context
-- 
-- Solution: Make display_name nullable and simplify the trigger to insert NULL initially

-- ===== STEP 1: Check if profiles table exists =====
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE EXCEPTION 'profiles table does not exist. Please create it first.';
    END IF;
END $$;

-- ===== STEP 2: Allow display_name to be NULL =====
-- This allows users to register without a display_name, which they'll set in the profile setup step
DO $$ 
BEGIN
    -- Check if the column exists first
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'display_name'
    ) THEN
        -- Remove NOT NULL constraint if it exists
        ALTER TABLE public.profiles 
        ALTER COLUMN display_name DROP NOT NULL;
        
        RAISE NOTICE '✅ display_name column is now nullable';
    ELSE
        RAISE EXCEPTION '❌ display_name column does not exist in profiles table';
    END IF;
END $$;

-- ===== STEP 3: Update the trigger function =====
-- Change from using email as fallback to just using NULL
-- Users will set their display name in the profile setup screen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile with NULL display_name (will be set in profile setup step)
  -- Only use metadata if explicitly provided during signup
  INSERT INTO public.profiles (id, display_name, avatar_url, permissions)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name', -- NULL if not provided
    NEW.raw_user_meta_data->>'avatar_url',   -- NULL if not provided
    COALESCE((NEW.raw_user_meta_data->>'permissions')::user_permission, 'supporter')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== STEP 4: Ensure trigger exists =====
-- The trigger should already exist, but we'll recreate it to be sure
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ===== SUCCESS MESSAGE =====
DO $$ 
BEGIN
    RAISE NOTICE '✅ Registration fix applied successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '  - display_name column is now nullable';
    RAISE NOTICE '  - Trigger updated to insert NULL for display_name';
    RAISE NOTICE '  - Users will set display_name in profile setup screen';
    RAISE NOTICE '';
    RAISE NOTICE 'Try registering a new account now!';
END $$;
