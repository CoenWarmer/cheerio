# User Activity Tracking Setup Guide

## Overview

This guide will help you set up the user activity tracking system that allows users to share their real-time location, speed, distance, and music in the room.

## Step 1: Run the Database Migration

Navigate to your Supabase dashboard and run the SQL migration:

1. Go to: https://oumenpdjtlflmelorrrj.supabase.co
2. Navigate to **SQL Editor**
3. Open and run the migration file: `packages/web-app/migrations/create-user-activity-table.sql`

This will:

- Create the `user_activity` table
- Set up indexes for efficient queries
- Configure Row Level Security (RLS) policies

## Step 2: Enable Realtime on the `user_activity` Table

To enable real-time updates for user activities:

1. In your Supabase dashboard, navigate to **Database** → **Replication**
2. Find the `user_activity` table in the list
3. Click the toggle to enable Realtime replication for this table
4. Save changes

## Step 3: Regenerate TypeScript Types

After running the migration, regenerate the TypeScript types to include the new `user_activity` table:

```bash
cd packages/web-app
yarn supabase:types
```

## Step 4: Test the Feature

1. Start your Next.js development server (if not already running):

   ```bash
   yarn dev
   ```

2. Navigate to any room (e.g., `http://localhost:3001/room/your-room-slug`)

3. You should see two new sections:
   - **Activity Tracker**: Allows you to start/stop tracking your location, speed, and distance
   - **User Activities**: Shows real-time activities from other users in the room

4. Click "Start Tracking" to begin sharing your activity

5. Open the same room in another browser/incognito tab (logged in as a different user) to see real-time updates

## Features Implemented

### Activity Tracker Component

- Tracks user's real-time location using the Geolocation API
- Calculates speed and distance automatically
- Sends periodic updates to the server
- Shows current statistics (distance traveled, current speed)
- Start/stop button for tracking control

### User Activity Feed Component

- Displays activities from other users in the room
- Shows the most recent location, speed, distance, and music for each user
- Real-time updates via Supabase Realtime
- Relative timestamps (e.g., "2m ago", "just now")

### Map Integration

- **Room location marker**: Blue standard marker showing the room's fixed location
- **User location markers**: Colored markers (one per user) showing real-time user positions
- Each user gets a unique color from a palette of 8 colors
- User markers update in real-time as users move
- Click on markers to see details:
  - User ID
  - Exact coordinates
  - Last update time
  - GPS accuracy (if available)

### API Routes

- `GET /api/rooms/[slug]/activity` - Fetch activity history with filters
- `POST /api/rooms/[slug]/activity` - Create new activity entry
- `GET /api/rooms/[slug]/activity/my-journey` - Get user's full journey with statistics

### Activity Types

The system currently supports four activity types:

1. **Location**: `{ lat: number, long: number, accuracy?: number }`
2. **Speed**: `{ speed: number, unit: 'kmh' | 'mph' }`
3. **Distance**: `{ distance: number, unit: 'km' | 'miles' }`
4. **Music**: `{ title: string, artist: string, album?: string, service?: 'spotify' | 'apple' | 'manual' }`

### Extensibility

The system uses JSONB for activity data, making it easy to add new activity types in the future without schema changes. Potential future activities:

- Heart rate
- Cadence (for cycling)
- Elevation
- Weather conditions
- Photos/media

## Privacy & Security

- Users can only insert their own activities (enforced by RLS)
- All authenticated users can see activities in the room (public visibility as specified)
- Users can update/delete only their own activities
- Historical data is preserved for analytics

## Troubleshooting

### "Failed to update location" error

- Check browser permissions for location access
- Ensure HTTPS is enabled (required for Geolocation API in production)

### Activities not appearing in real-time

- Verify Realtime is enabled on the `user_activity` table in Supabase
- Check browser console for subscription errors
- Ensure RLS policies are correctly set up

### No activities visible

- Confirm the migration ran successfully
- Check that TypeScript types were regenerated
- Verify users are actually starting the tracker

### User markers not showing on map

- Ensure users have started tracking (click "Start Tracking")
- Check that Realtime subscriptions are working (browser console)
- Verify the map component is receiving `userLocations` prop

## Next Steps

To add music tracking:

1. Integrate with Spotify/Apple Music APIs
2. Create a music sharing component
3. Send music activity updates via `activityApi.createActivity()`

Example:

```typescript
await activityApi.createActivity(roomSlug, {
  activity_type: 'music',
  data: {
    title: 'Song Title',
    artist: 'Artist Name',
    service: 'spotify',
  },
});
```
