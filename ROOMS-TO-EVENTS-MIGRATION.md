# Rooms → Events Rename - Complete Migration Guide

## Overview

This document outlines the comprehensive rename of "Rooms" to "Events" throughout the Cheerioo codebase, including database, backend API, frontend, and iOS app.

## ✅ Completed Changes

### 1. File & Directory Renames

#### Web App

- ✅ `/src/app/rooms` → `/src/app/events`
- ✅ `/src/app/room` → `/src/app/event`
- ✅ `/src/app/api/rooms` → `/src/app/api/events`
- ✅ `RoomPageClient.tsx` → `EventPageClient.tsx`
- ✅ `RoomMap.tsx` → `EventMap.tsx`
- ✅ `useRooms.ts` → `useEvents.ts`
- ✅ `useRoomMembers.ts` → `useEventMembers.ts`
- ✅ `useRoomsQueries.ts` → `useEventsQueries.ts`
- ✅ `useRoomMembersQueries.ts` → `useEventMembersQueries.ts`

#### iOS App

- ✅ `Room.swift` → `Event.swift`
- ✅ `RoomService.swift` → `EventService.swift`
- ✅ `RoomListView.swift` → `EventListView.swift`
- ✅ `RoomDetailView.swift` → `EventDetailView.swift`
- ✅ `Views/Rooms/` → `Views/Events/`

### 2. Code Content Updates

#### TypeScript/JavaScript (52 files updated)

- All variable/function names: `roomSlug` → `eventSlug`, `roomId` → `eventId`
- All type names: `Room` → `Event`, `RoomMember` → `EventMember`
- All API functions: `roomsApi` → `eventsApi`, `roomMembersApi` → `eventMembersApi`
- All hook names: `useRooms` → `useEvents`, `useRoom` → `useEvent`
- All query keys: `roomKeys` → `eventKeys`
- All URL paths: `/rooms` → `/events`, `/room/` → `/event/`
- All API paths: `/api/rooms` → `/api/events`

#### Swift Files (9 files updated)

- All model references: `Room` → `Event`
- All service references: `RoomService` → `EventService`
- All view names: `RoomListView` → `EventListView`, `RoomDetailView` → `EventDetailView`
- All variable names: `currentRoomSlug` → `currentEventSlug`

#### Documentation (5 markdown files updated)

- Updated all references to events instead of rooms
- Updated example code snippets
- Updated API documentation

#### Xcode Project File

- ✅ Updated all file references
- ✅ Updated build phase references
- ✅ Updated group names (Rooms → Events)
- ✅ Updated permission strings ("in the room" → "in the event")

### 3. Database Migration Created

**File:** `packages/web-app/migrations/rename-rooms-to-events.sql`

**Changes the migration will make:**

- Rename `rooms` table → `events`
- Rename `room_members` table → `event_members`
- Rename all `event_id` columns → `event_id` in:
  - `event_members` table
  - `messages` table
  - `user_activity` table
- Update all foreign key constraints
- Rename all indexes
- Update all RLS (Row Level Security) policies
- Update table/column comments

## 🔄 Next Steps - Manual Actions Required

### 1. Run Database Migration

```bash
# Connect to your Supabase database and run:
psql -h <your-db-host> -U postgres -d postgres < packages/web-app/migrations/rename-rooms-to-events.sql

# Or via Supabase dashboard:
# 1. Go to SQL Editor
# 2. Paste the contents of migrations/rename-rooms-to-events.sql
# 3. Execute
```

### 2. Regenerate Database Types

After the migration, regenerate TypeScript types:

```bash
cd packages/web-app
npm run generate-types
```

Then update `/src/types/types.ts`:

```typescript
// Change from:
export type Event = Database['public']['Tables']['rooms']['Row'];
export type EventMember = Database['public']['Tables']['room_members']['Row'];

// To:
export type Event = Database['public']['Tables']['events']['Row'];
export type EventMember = Database['public']['Tables']['event_members']['Row'];
```

### 3. Test the Application

#### Web App

```bash
cd packages/web-app
npm run dev
```

Test scenarios:

- ✅ Navigate to `/events` - should show event list
- ✅ Click on an event - should navigate to `/event/[slug]`
- ✅ Create new event from `/new`
- ✅ Join an event
- ✅ Post messages in an event
- ✅ Track activity in an event

#### iOS App

```bash
cd packages/ios-app
open CheeriooApp.xcodeproj
# Build and run (Cmd+R)
```

Test scenarios:

- ✅ Login/Register
- ✅ View event list
- ✅ Join an event
- ✅ Track location
- ✅ Send messages

### 4. Update Environment Variables (Optional)

If you have any environment variables or external configs referencing "rooms", update them:

```bash
# Check for any remaining references
grep -r "room" .env* --include="*.env*"
```

### 5. Clear Browser Cache

Users may need to clear browser cache/local storage for route changes to take effect cleanly.

## 📝 Summary of Changes

### Statistics

- **Files renamed:** 16
- **Files content updated:** 66+
- **Database tables renamed:** 2
- **Database columns renamed:** 3 (in multiple tables)
- **API routes changed:** `/api/rooms/*` → `/api/events/*`
- **Frontend routes changed:** `/rooms`, `/room/*` → `/events`, `/event/*`

### Breaking Changes

⚠️ **This is a breaking change for:**

1. **Database schema** - requires migration
2. **API endpoints** - all `/api/rooms/*` endpoints are now `/api/events/*`
3. **Frontend routes** - all `/rooms` and `/room/*` routes are now `/events` and `/event/*`
4. **Mobile apps** - API calls need to be updated

### Backward Compatibility

- TypeScript types include legacy aliases (`Room`, `RoomMember`) for a transition period
- Can be removed after confirming all references are updated

## 🐛 Troubleshooting

### Database Migration Fails

If the migration fails, it might be because:

1. There are active connections to tables being renamed
2. Existing constraints conflict

**Solution:** Run each step of the migration individually and check for errors.

### TypeScript Type Errors After Migration

```bash
# Regenerate types
cd packages/web-app
npm run generate-types
```

### iOS Build Errors

1. Clean build folder: `Product` → `Clean Build Folder` (Shift+Cmd+K)
2. Close and reopen Xcode
3. Delete derived data: `~/Library/Developer/Xcode/DerivedData/`

### Routes Not Working

1. Clear Next.js cache: `rm -rf packages/web-app/.next`
2. Restart dev server
3. Clear browser cache/localStorage

## 🎉 Verification Checklist

Before deploying:

- [ ] Database migration completed successfully
- [ ] Database types regenerated
- [ ] Web app builds without errors
- [ ] iOS app builds without errors
- [ ] All routes accessible (`/events`, `/event/[slug]`, `/new`)
- [ ] API endpoints working (`/api/events/*`)
- [ ] Event creation works
- [ ] Event joining works
- [ ] Messaging works
- [ ] Location tracking works
- [ ] iOS app can fetch events
- [ ] iOS app can join events
- [ ] All tests passing (if applicable)

## 📚 Additional Notes

### Why This Rename?

The terminology "Events" better represents the concept of gatherings/activities that users participate in, vs. "Rooms" which implies static spaces.

### Database Table Names

While we've renamed tables in the database (`rooms` → `events`), the core functionality remains the same. All relationships and constraints are preserved.

### Gradual Migration

If you need to roll back:

1. The database migration includes DROP and CREATE statements that can be reversed
2. Git can be used to revert code changes
3. Consider creating a backup before running the migration

## 🔗 Related Files

- Migration script: `packages/web-app/migrations/rename-rooms-to-events.sql`
- Rename script: `scripts/rename-rooms-to-events.sh`
- Types: `packages/web-app/src/types/types.ts`
- API Client: `packages/web-app/src/lib/api-client.ts`

---

Generated: 2025-10-15
Last updated: After complete rename implementation
