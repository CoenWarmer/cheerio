# Row Level Security (RLS) Policies

## The Issue

If you're getting empty arrays from API routes even though data exists, it's likely because **Row Level Security (RLS)** is enabled on your Supabase tables but no policies are configured.

## Quick Fix

Run these SQL commands in your Supabase SQL Editor to add proper RLS policies:

### 1. Rooms Table Policies

```sql
-- Enable RLS on rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read all rooms
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT
  USING (true);

-- Allow authenticated users to create rooms
CREATE POLICY "Authenticated users can create rooms" ON rooms
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own rooms
CREATE POLICY "Users can update own rooms" ON rooms
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Allow users to delete their own rooms
CREATE POLICY "Users can delete own rooms" ON rooms
  FOR DELETE
  USING (auth.uid() = created_by);
```

### 2. Messages Table Policies

```sql
-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages
CREATE POLICY "Anyone can read messages" ON messages
  FOR SELECT
  USING (true);

-- Allow authenticated users to create messages
CREATE POLICY "Authenticated users can create messages" ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own messages
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete (soft delete) their own messages
CREATE POLICY "Users can delete own messages" ON messages
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted = false);
```

## Run These in Supabase

1. Go to your Supabase SQL Editor:
   👉 **https://app.supabase.com/project/oumenpdjtlflmelorrrj/sql**

2. Copy and paste the SQL above
3. Click "Run" or press `Cmd/Ctrl + Enter`

## What These Policies Do

### Rooms:

- ✅ **Read** - Anyone can view all rooms (public)
- ✅ **Create** - Only authenticated users can create rooms (and they must set themselves as creator)
- ✅ **Update** - Users can only update rooms they created
- ✅ **Delete** - Users can only delete rooms they created

### Messages:

- ✅ **Read** - Anyone can read all messages
- ✅ **Create** - Only authenticated users can send messages (and they must set themselves as sender)
- ✅ **Update** - Users can only update their own messages
- ✅ **Delete** - Users can only soft-delete their own messages

## Alternative: More Restrictive Policies

If you want to make rooms private by default:

```sql
-- Only show non-private rooms OR rooms created by the user
CREATE POLICY "Users see public rooms and own rooms" ON rooms
  FOR SELECT
  USING (
    is_private = false
    OR auth.uid() = created_by
  );
```

## Checking Existing Policies

To see what policies exist:

```sql
-- View all policies for rooms table
SELECT * FROM pg_policies WHERE tablename = 'rooms';

-- View all policies for messages table
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

## Removing Old Policies

If you need to remove existing policies:

```sql
-- Drop all policies for rooms
DROP POLICY IF EXISTS "policy_name" ON rooms;

-- Drop all policies for messages
DROP POLICY IF EXISTS "policy_name" ON messages;
```

## Testing

After adding policies:

1. **Test unauthenticated access:**
   - Open browser in incognito mode
   - Visit `/rooms` - should see public rooms

2. **Test authenticated access:**
   - Sign in
   - Create a new room
   - Should appear in list

3. **Test API routes:**
   - Check browser console for API calls
   - Should return data, not empty arrays

## Debug: Check If RLS Is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('rooms', 'messages');
```

- `rowsecurity = true` means RLS is enabled
- `rowsecurity = false` means RLS is disabled

## Production Recommendation

For production, you should:

1. ✅ Keep RLS enabled
2. ✅ Use specific policies for each operation
3. ✅ Test policies thoroughly
4. ✅ Consider using service role key for admin operations
5. ✅ Add policies for presence and other tables as needed
