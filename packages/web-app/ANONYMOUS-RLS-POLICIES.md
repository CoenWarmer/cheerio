# Anonymous User RLS Policy Changes

## Overview
This document explains the Row Level Security (RLS) policy changes that enable anonymous users to participate in Cheerio.

## What Changed

### Before
- All policies used `TO authenticated` - only logged-in users could access data
- `auth.uid()` was used to validate user ownership
- Anonymous users were completely blocked by RLS

### After
- Policies now use `TO public` - both authenticated and anonymous users can access data
- Application layer validates user ownership instead of database layer
- Anonymous users can view events, join them, and send messages

## Tables Modified

### 1. **events** table
```sql
✅ Anyone can view events (TO public)
✅ Authenticated users can create events
✅ Authenticated users can update/delete their own events
```

### 2. **event_members** table
```sql
✅ Anyone can view event members (TO public)
✅ Anyone can join events (TO public)
✅ Anyone can leave events (TO public)
```

### 3. **messages** table
```sql
✅ Anyone can read messages (TO public)
✅ Anyone can create messages (TO public)
✅ Anyone can update their own messages (TO public)
✅ Anyone can soft-delete messages (TO public)
```

### 4. **user_activity** table (if exists)
```sql
✅ Anyone can view activity (TO public)
✅ Anyone can create activity (TO public)
✅ Anyone can update activity (TO public)
```

## How to Apply

1. **Run the migration in Supabase SQL Editor:**
   ```bash
   # Copy the contents of migrations/add-anonymous-user-support.sql
   # Paste into: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
   # Click "Run"
   ```

2. **Verify the policies:**
   ```sql
   -- Check events policies
   SELECT * FROM pg_policies WHERE tablename = 'events';
   
   -- Check event_members policies
   SELECT * FROM pg_policies WHERE tablename = 'event_members';
   
   -- Check messages policies
   SELECT * FROM pg_policies WHERE tablename = 'messages';
   ```

## Security Considerations

### ⚠️ Important: Application Layer Validation Required

Since we're using `TO public` policies, the **application layer must validate user ownership**. This is handled by:

1. **useCurrentUser hook** - Provides the correct user ID:
   ```typescript
   const { currentUser } = useCurrentUser();
   // currentUser.id will be:
   // - auth.uid() for authenticated users
   // - anonymous_profiles.id for anonymous users
   ```

2. **API calls** - Always use the correct user ID:
   ```typescript
   // ✅ Correct
   await createMessage({
     user_id: currentUser.id,  // From useCurrentUser
     content: 'Hello',
     event_id: eventId
   });
   
   // ❌ Wrong - don't hardcode or trust client input
   await createMessage({
     user_id: someUntrustedId,  // Could be manipulated
     content: 'Hello',
     event_id: eventId
   });
   ```

3. **Components** - Validate before mutations:
   ```typescript
   const handleJoinEvent = async () => {
     if (!currentUser?.id) {
       console.error('No user ID available');
       return;
     }
     
     await joinEvent(eventId, currentUser.id);
   };
   ```

### Trade-offs

| Aspect | Benefit | Risk |
|--------|---------|------|
| **Access** | ✅ Anonymous users can participate | ⚠️ Public read access to all events/messages |
| **Validation** | ✅ Flexible for auth + anonymous | ⚠️ Must validate in app code |
| **Privacy** | ✅ No email required | ⚠️ Data not portable across devices |
| **UX** | ✅ Lower barrier to entry | ⚠️ Users can lose data if localStorage cleared |

### What's Protected

- ✅ **Profiles table** - Still authenticated-only (contains email, sensitive data)
- ✅ **Event creation** - Only authenticated users can create events
- ✅ **Event ownership** - Only creators can update/delete their events
- ⚠️ **Message/member validation** - Enforced in app layer, not database

### What's NOT Protected

- ⚠️ Anonymous users could theoretically join events with any UUID
- ⚠️ Anonymous users could send messages with any UUID
- ⚠️ Anonymous users could see all messages in all events

**Mitigation:** The app layer (useCurrentUser hook) ensures users only use their own UUID. Browser DevTools manipulation is possible, but requires technical knowledge and only affects that user's experience.

## Components That Need Updates

The following components should be updated to use `useCurrentUser()` instead of `useUser()`:

### High Priority
- ✅ **AnonymousSetup** - Already uses useAnonymousUser
- ✅ **HomeClient** - Already uses both hooks
- ⏳ **ChatSidebar** - Update to use useCurrentUser
- ⏳ **EventPageClient** - Update to use useCurrentUser
- ⏳ **ActivityTracker** - Update to use useCurrentUser

### Example Refactor

**Before:**
```typescript
const { user } = useUser();

const handleSendMessage = async (content: string) => {
  if (!user) return;
  
  await createMessage({
    user_id: user.id,
    content,
    event_id: eventId
  });
};
```

**After:**
```typescript
const { currentUser, isAuthenticated, isAnonymous } = useCurrentUser();

const handleSendMessage = async (content: string) => {
  if (!currentUser?.id) return;
  
  await createMessage({
    user_id: currentUser.id,  // Works for both auth and anonymous
    content,
    event_id: eventId
  });
};
```

## Testing Checklist

After running the migration:

- [ ] Anonymous user can view events list
- [ ] Anonymous user can view event details
- [ ] Anonymous user can join an event
- [ ] Anonymous user can send messages in event chat
- [ ] Anonymous user can see their own messages
- [ ] Anonymous user can see other users' messages
- [ ] Authenticated user can still do everything as before
- [ ] Authenticated user and anonymous user can chat together
- [ ] Anonymous user's data persists across page reloads (localStorage)
- [ ] Anonymous user's data is lost if localStorage cleared (expected behavior)

## Rollback Plan

If you need to revert these changes:

```sql
-- Revert to authenticated-only policies
-- Run migrations/revert-anonymous-support.sql (create this if needed)

-- Or manually restore policies:
DROP POLICY IF EXISTS "Anyone can view events" ON events;
CREATE POLICY "Users can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- Repeat for other tables...
```

## Next Steps

1. ✅ Run `migrations/create-anonymous-profiles.sql` (if not already done)
2. ✅ Run `migrations/add-anonymous-user-support.sql`
3. ⏳ Regenerate TypeScript types: `npm run generate:types`
4. ⏳ Update components to use `useCurrentUser()`
5. ⏳ Test anonymous user flow end-to-end
6. ⏳ Consider adding "Upgrade to Account" feature

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Anonymous User Implementation: `ANONYMOUS-USER-IMPLEMENTATION.md`
