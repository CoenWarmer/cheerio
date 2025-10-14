# Profile Avatars Setup Guide

## Overview

This guide will help you set up avatar storage for user profiles using Supabase Storage.

## Step 1: Update the Profiles Table and Set Up RLS

Make sure your `profiles` table has an `avatar_url` column and proper RLS policies. Run this SQL in your Supabase SQL Editor:

You can run the migration file: `packages/web-app/migrations/setup-profiles-rls.sql`

Or run this SQL directly:

```sql
-- Add avatar_url column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Enable Row Level Security on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow anyone to view profiles (needed for displaying user names and avatars)
CREATE POLICY "Users can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

## Step 2: Create the Avatars Storage Bucket

1. Go to your Supabase dashboard: https://oumenpdjtlflmelorrrj.supabase.co
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public**: Yes (check "Public bucket")
   - **File size limit**: 5242880 (5MB in bytes)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`

## Step 3: Set Up Storage RLS Policies

**IMPORTANT**: Before running these policies, make sure to delete any existing policies on the `storage.objects` table for the `avatars` bucket to avoid conflicts.

Run these SQL statements in your Supabase SQL Editor to set up Row Level Security for the avatars bucket:

```sql
-- Allow authenticated users to upload their own avatars
-- Files are stored as: user-id/filename.ext
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view avatars (since it's a public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### Alternative: If the above policies don't work, try this simplified approach:

```sql
-- Delete existing policies first
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Simpler policies that work with public buckets
CREATE POLICY "Authenticated users can upload to avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

**Note**: The simplified approach allows any authenticated user to upload/manage any file in the avatars bucket. For production, you should use the first approach with user-specific folder checks.

## Step 4: Regenerate TypeScript Types

After updating the database schema, regenerate the TypeScript types:

```bash
cd packages/web-app
yarn supabase:types
```

## Step 5: Test the Feature

1. Start your Next.js development server (if not already running):

   ```bash
   yarn dev
   ```

2. Navigate to the dashboard at `http://localhost:3001/dashboard`

3. Click on **👤 Edit Profile**

4. Test the features:
   - Upload an avatar image (JPEG, PNG, or WebP, max 5MB)
   - Change your display name
   - Save changes
   - Remove avatar

## Features Implemented

### Profile Page (`/profile`)

- View and edit display name
- Upload avatar image with preview
- Remove avatar
- Read-only email display
- Success/error message handling
- Image validation (type and size)

### API Routes

**`GET /api/profile`**

- Fetches current user's profile
- Creates empty profile structure if doesn't exist

**`PUT /api/profile`**

- Updates or creates user profile
- Accepts `display_name` and `avatar_url`

**`POST /api/profile/avatar`**

- Uploads avatar image to Supabase Storage
- Validates file type and size
- Returns public URL

**`DELETE /api/profile/avatar`**

- Deletes avatar from storage
- Requires file path

### Updated Components

**Dashboard**

- Added "Edit Profile" link in Quick Links section

**User Activity Feed & Room Page**

- Now displays user avatars alongside names (if available)
- Proper fallback to initials if no avatar

## File Structure

```
packages/web-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── profile/
│   │   │       ├── route.ts          # Get/update profile
│   │   │       └── avatar/
│   │   │           └── route.ts      # Upload/delete avatar
│   │   ├── profile/
│   │   │   └── page.tsx              # Profile edit page
│   │   └── dashboard/
│   │       └── page.tsx              # Updated with profile link
│   └── lib/
│       └── api-client.ts             # Updated with profile methods
```

## Troubleshooting

### "Failed to upload avatar" error

- Check that the `avatars` bucket exists and is public
- Verify RLS policies are set up correctly
- Ensure file type and size are within limits

### Avatar not displaying

- Check browser console for CORS errors
- Verify the avatar URL is publicly accessible
- Ensure the image was uploaded successfully

### "Unauthorized" error

- Make sure the user is logged in
- Check that the session is valid

## Next Steps

To enhance the profile feature, you could:

1. **Add avatar cropping**: Use a library like `react-easy-crop` to let users crop their avatar before upload

2. **Show avatar in navbar**: Display user's avatar in the navigation bar across all pages

3. **Add more profile fields**: Bio, location, social links, etc.

4. **Avatar in chat**: Update `ChatSidebar` component to show user avatars next to messages

5. **Profile pictures in UserActivityFeed**: Already supported! The component will display avatars when available.
