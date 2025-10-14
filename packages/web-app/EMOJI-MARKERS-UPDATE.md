# Emoji Markers - Location Storage Update

## Problem

Emoji markers were only visible to the user who sent them, not to other users in the room. This was because:

- Emoji marker locations were looked up from `userLocations` state (most recent location per user)
- When other users joined the room, they only saw each user's **current** location, not where they were when they sent the emoji
- Historical emoji locations were lost

## Solution

Store the user's location **with the message** when it's sent, making emoji markers permanent and visible to all users.

## Changes Made

### 1. Database Schema

- **File**: `migrations/add-location-to-messages.sql`
- **Action**: Added `location JSONB` column to `messages` table
- **Format**: `{ "lat": number, "long": number }`
- **Run**: Execute this migration in Supabase SQL editor

### 2. API Route (`/api/rooms/[slug]/messages`)

- **File**: `src/app/api/rooms/[slug]/messages/route.ts`
- **Changes**:
  - Accept optional `location` field in POST body
  - Store location with message in database

### 3. API Client

- **File**: `src/lib/api-client.ts`
- **Changes**: Updated `messagesApi.create()` signature to accept optional `location` field

### 4. ChatSidebar Component

- **File**: `src/components/ChatSidebar.tsx`
- **Changes**:
  - Added `currentUserLocation` prop (passed from parent)
  - Added `isEmoji()` helper function
  - When sending an emoji message, include `location` if user is tracking

### 5. Room Page

- **File**: `src/app/room/[slug]/page.tsx`
- **Changes**:
  - Updated `EmojiMarker` interface: `location` is now `{ lat: number; long: number }`
  - Pass current user's location to `ChatSidebar` component
  - **Initial load**: Read emoji locations from `message.location` field
  - **Real-time**: Read emoji locations from message payload's `location` field
  - Removed dependency on `userLocations` for emoji markers

## How It Works Now

### Sending an Emoji

1. User types an emoji in chat (e.g., 🎉)
2. `ChatSidebar` detects it's an emoji using regex
3. If user is tracking (has a location), include location with message
4. Message saved to database with `location: { lat: number, long: number }`

### Viewing Emoji Markers

1. **On page load**:
   - Fetch all messages from room
   - Filter for emoji messages (single emoji only)
   - Check if message has a `location` field
   - Create marker at stored location

2. **Real-time**:
   - Listen for new message inserts
   - If emoji + has location → add marker
   - All users in room see the marker immediately

### Benefits

✅ Emoji markers are permanent (stored in database)  
✅ Visible to all users, not just sender  
✅ Historical accuracy (shows where user was when sent)  
✅ No dependency on current tracking status  
✅ Simplified logic (no timestamp matching needed)

## Migration Steps

1. **Run the migration**:

   ```sql
   -- In Supabase SQL Editor
   -- Copy and paste contents of migrations/add-location-to-messages.sql
   ```

2. **Regenerate TypeScript types**:

   ```bash
   cd packages/web-app
   yarn supabase:types
   ```

3. **Test**:
   - User A (tracker): Start tracking, send emoji → should see marker
   - User B (supporter): Join room → should see User A's emoji marker
   - User B: Send emoji (not tracking) → no marker
   - User A: Stop tracking, send emoji → no marker

## Notes

- Any user who is actively tracking can create emoji markers (location required)
- Only single emojis sent while tracking get markers
- All users can see all emoji markers in the room
- Emoji detection uses Unicode regex for accurate matching
- Supporters normally cannot track (UI hides tracking button), so they typically cannot create markers
