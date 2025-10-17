# 🔧 Storage Setup Guide for Anonymous User Uploads

## Quick Fix (5 minutes)

The "must be owner of table objects" error means you need to use the Supabase Dashboard UI instead of SQL.

## ✅ Steps to Enable Anonymous Uploads

### 1. Open Storage in Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Storage** in the left sidebar

### 2. Configure the `room-attachments` Bucket

**If the bucket doesn't exist:**

1. Click "**New bucket**"
2. Enter name: `room-attachments`
3. ✅ **Check** "Public bucket"
4. Click "**Create bucket**"

**If the bucket exists:**

1. Click on `room-attachments`
2. Click the **Configuration** or gear icon
3. ✅ Enable "**Public bucket**"
4. Click "**Save**"

### 3. Add Upload Policies

1. While viewing the `room-attachments` bucket, click the **Policies** tab
2. Click "**New Policy**"

#### Add Policy 1: Allow Uploads

- Click "**For full customization**" or "Create policy from scratch"
- Policy name: `Allow public uploads`
- Allowed operation: Check **INSERT**
- Target roles: `public`
- USING expression: leave blank or enter `true`
- WITH CHECK expression: enter `true`
- Click "**Save policy**"

#### Add Policy 2: Allow Reads

- Click "**New Policy**" again
- Policy name: `Allow public reads`
- Allowed operation: Check **SELECT**
- Target roles: `public`
- USING expression: enter `true`
- Click "**Save policy**"

#### Add Policy 3: Allow Deletes (Optional)

- Click "**New Policy**" again
- Policy name: `Allow public deletes`
- Allowed operation: Check **DELETE**
- Target roles: `public`
- USING expression: enter `true`
- Click "**Save policy**"

### 4. Test It!

1. Log out and log in as an anonymous user
2. Navigate to an event
3. Click the microphone button to record audio
4. The upload should now work! ✅

## 🎯 What This Does

- ✅ Makes the bucket **public** (files are readable by anyone with the URL)
- ✅ Allows **anyone** to upload files (needed for anonymous users)
- ✅ Allows **anyone** to read files (needed to play back audio)
- ✅ Allows **anyone** to delete files (optional, for cleanup)

## 🔒 Security Notes

This configuration is **safe** for a messaging/social app because:

- Files have unique names (timestamp + user ID)
- API already limits file size to 10MB
- Files are scoped to event folders
- This is standard for apps where anyone can participate

## 🐛 Troubleshooting

**Still getting 500 errors?**

- Verify the bucket is marked as "Public"
- Check that all three policies were created
- Try deleting and recreating the policies
- Make sure you clicked "Save" after each policy

**Can't see the Policies tab?**

- You might not have the right permissions
- Contact your Supabase project admin
- Or use a service role key (not recommended for production)

## 📝 Alternative: Simple SQL Approach

If you just want to make it work quickly, run this in SQL Editor:

```sql
-- Just make the bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'room-attachments';
```

Then add the policies through the Dashboard UI as described above.
