# Fix Registration Error - Database Migration

## Problem

The registration is failing with "Database error saving new user" because the `display_name` column in the profiles table has a NOT NULL constraint, but we're now creating users without setting the display name initially (it's set in the profile setup step).

## Solution

We need to:

1. **Diagnose** the current database state
2. **Fix** the NOT NULL constraint and trigger

## Step-by-Step Instructions

### Step 1: Diagnose the Issue

1. Go to: https://supabase.com/dashboard/project/oumenpdjtlflmelorrrj/sql/new
2. Copy the entire contents of `migrations/diagnose-registration-issue.sql`
3. Paste and **Run** it
4. Review the results to see:
   - ✅ Does the profiles table exist?
   - ✅ Does the trigger function exist?
   - ✅ Does the trigger exist?
   - ⚠️ Is `display_name` column nullable? (It should show `is_nullable = 'NO'` - this is the problem)

### Step 2: Apply the Fix

1. In the same SQL Editor (or open a new query)
2. Copy the entire contents of `migrations/allow-null-display-name.sql`
3. Paste and **Run** it
4. You should see success messages like:
   ```
   ✅ display_name column is now nullable
   ✅ Registration fix applied successfully!
   ```

### Step 3: Test Registration

1. Go to your app's registration page
2. Try registering with a new email
3. You should now:
   - ✅ Successfully create an account
   - ✅ See the profile setup screen
   - ✅ Be able to enter a display name and upload an avatar
   - ✅ Be redirected to the events page

## What This Migration Does

### Before:

```
auth.users (INSERT) → trigger → profiles (INSERT with display_name NOT NULL) → ❌ FAILS
```

### After:

```
auth.users (INSERT) → trigger → profiles (INSERT with NULL display_name) → ✅ SUCCESS
                                ↓
                         User sees profile setup form
                                ↓
                         User enters display_name
                                ↓
                         profiles (UPDATE with display_name) → ✅ COMPLETE
```

## Technical Changes

1. **`display_name` column**: Changed from `NOT NULL` to `NULL` (nullable)
2. **`handle_new_user()` function**: Updated to insert NULL for display_name initially
3. **Error handling**: Added exception handling to prevent user creation from failing if profile creation has issues

## Rollback (if needed)

If you need to rollback this change:

```sql
-- Make display_name required again (only do this if you're sure all profiles have display_name set)
ALTER TABLE public.profiles
ALTER COLUMN display_name SET NOT NULL;
```

⚠️ **Warning**: Only rollback if all existing profiles have a display_name set, otherwise this will fail.
