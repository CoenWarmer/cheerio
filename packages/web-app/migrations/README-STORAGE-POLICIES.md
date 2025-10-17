# Storage Policies Setup for Anonymous Users

## Problem

Anonymous users receive a `500 Internal Server Error` when trying to upload audio attachments:

```
"Upload failed: new row violates row-level security policy"
```

This happens because the Supabase Storage bucket `room-attachments` has Row Level Security (RLS) enabled but no policies that allow anonymous users to upload.

## Solution

Run the `setup-storage-policies.sql` migration to add storage policies that allow both authenticated and anonymous users to upload attachments.

## Steps to Fix

### 1. Ensure the Storage Bucket Exists

First, check if the `room-attachments` bucket exists in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Look for a bucket named `room-attachments`

**If the bucket doesn't exist:**

- Click "New bucket"
- Name: `room-attachments`
- Public: ✅ **Enable** (allows public read access)
- Click "Create bucket"

### 2. Run the Migration

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `setup-storage-policies.sql`
3. Paste into the SQL editor
4. Click **Run**

### 3. Verify the Policies

After running the migration, verify the policies were created:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage';
```

You should see three policies:

- ✅ `Allow public uploads to room-attachments` (INSERT)
- ✅ `Allow public read access to room-attachments` (SELECT)
- ✅ `Allow users to delete their own attachments` (DELETE)

## What These Policies Do

### Policy 1: Allow Public Uploads

```sql
FOR INSERT TO public
WITH CHECK (bucket_id = 'room-attachments')
```

- Allows anyone (authenticated or anonymous) to upload files to the bucket
- No authentication required

### Policy 2: Allow Public Read Access

```sql
FOR SELECT TO public
USING (bucket_id = 'room-attachments')
```

- Allows anyone to read/download files from the bucket
- Necessary for playing back audio messages

### Policy 3: Allow Users to Delete Their Own Attachments

```sql
FOR DELETE TO public
USING (bucket_id = 'room-attachments' AND ...)
```

- Allows authenticated users to delete only their own attachments
- Uses the path structure to match user_id

## Security Considerations

✅ **Safe for your use case** because:

- Public uploads are expected behavior (anyone can join events and send messages)
- Files are stored with unique names (timestamp + user ID) preventing conflicts
- The bucket is scoped to event-specific folders
- Storage quota limits prevent abuse

⚠️ **Potential concerns:**

- Anonymous users can upload files (intended behavior)
- Files are publicly accessible (needed for message playback)
- Consider adding file size limits (already done in API: 10MB max)
- Consider adding rate limiting if abuse becomes an issue

## Testing

After running the migration:

1. Log in as an anonymous user
2. Navigate to an event
3. Try recording an audio message
4. The upload should succeed ✅
5. The audio message should play back in the chat ✅

## Rollback

If you need to revert these changes:

```sql
DROP POLICY IF EXISTS "Allow public uploads to room-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to room-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own attachments" ON storage.objects;

-- Add back your original policies if you had any
```

## Alternative Approach

If you prefer to keep RLS strict and only allow uploads through authenticated requests, you would need to:

1. Use a server-side upload endpoint that authenticates users
2. Generate signed URLs for uploads
3. Use Supabase service role key (bypasses RLS)

However, this adds complexity and the current solution (public uploads to a specific bucket) is appropriate for a social/messaging app.
