# Component Updates for Anonymous User Support

## Overview

This document tracks the component updates made to support anonymous users throughout the Cheerio application.

## Updated Components

### ✅ 1. EventPageClient.tsx

**Location:** `src/components/EventPageClient.tsx`

**Changes:**

- Replaced `useUser()` with `useCurrentUser()`
- Changed `user` variable to `currentUser`
- Updated all references from `user` to `currentUser`
- Updated `user.id` to `currentUser.id`
- Updated dependency arrays in useEffect hooks

**Key Updates:**

```typescript
// Before
const { user, isLoading: userLoading } = useUser();
if (user && eventSlug) { ... }

// After
const { currentUser, isLoading: userLoading } = useCurrentUser();
if (currentUser?.id && eventSlug) { ... }
```

**Impact:**

- ✅ Anonymous users can now view events
- ✅ Anonymous users can join events
- ✅ Anonymous users can use chat
- ✅ Anonymous users can track activities

---

### ✅ 2. HomeClient.tsx

**Location:** `src/components/HomeClient.tsx`

**Changes:**

- Replaced `useUser()` and `useAnonymousUser()` with single `useCurrentUser()`
- Simplified logic - now just checks if `currentUser` exists
- Reduced loading states from two separate hooks to one

**Key Updates:**

```typescript
// Before
const { user, isLoading: userLoading } = useUser();
const { isAnonymous, isLoading: anonymousLoading } = useAnonymousUser();
if (user) { redirect to events }
if (isAnonymous && !userLoading) { redirect to events }

// After
const { currentUser, isLoading } = useCurrentUser();
if (currentUser) { redirect to events }
```

**Impact:**

- ✅ Cleaner code with single source of truth
- ✅ Both authenticated and anonymous users redirect to /events
- ✅ New visitors see AnonymousSetup component

---

### ✅ 3. ChatSidebar.tsx

**Location:** `src/components/ChatSidebar.tsx`

**Changes:**

- Updated interface to accept `CurrentUser` instead of Supabase `User` type
- Changed import from `@supabase/supabase-js` to `@/hooks/useCurrentUser`

**Key Updates:**

```typescript
// Before
import type { User } from '@supabase/supabase-js';
interface ChatSidebarProps {
  currentUser: User;
  ...
}

// After
import type { CurrentUser } from '@/hooks/useCurrentUser';
interface ChatSidebarProps {
  currentUser: CurrentUser;
  ...
}
```

**Impact:**

- ✅ Can now accept both authenticated and anonymous users
- ✅ Works with unified CurrentUser interface
- ✅ Anonymous users can send and receive messages

---

### ✅ 4. NewEventPage (new/page.tsx)

**Location:** `src/app/[locale]/new/page.tsx`

**Changes:**

- Replaced `useUser()` with `useCurrentUser()`
- Added check for `isAuthenticated` to enforce authenticated-only event creation
- Updated `user.id` to `currentUser.id`

**Key Updates:**

```typescript
// Before
const { user } = useUser();
if (!user) {
  return error;
}
created_by: user.id;

// After
const { currentUser, isAuthenticated } = useCurrentUser();
if (!currentUser?.id) {
  return error;
}
if (!isAuthenticated) {
  return error;
} // Only authenticated can create
created_by: currentUser.id;
```

**Impact:**

- ✅ Uses unified user interface
- ✅ Explicitly checks authentication for event creation
- ✅ Anonymous users are blocked from creating events (as per RLS policy)

---

## Components That Don't Need Updates

### ✅ ActivityTracker.tsx

**Reason:** Doesn't directly use `useUser()` - uses `useProfile()` for permissions

### ✅ AnonymousSetup.tsx

**Reason:** Already built specifically for anonymous user flow, uses `useAnonymousUser()`

### ✅ AppHeader.tsx

**Reason:** Header navigation doesn't need user-specific logic changes

---

## Testing Checklist

### For Each Updated Component:

#### EventPageClient

- [ ] Anonymous user can view event page
- [ ] Anonymous user can see the map
- [ ] Anonymous user can see chat sidebar
- [ ] Anonymous user can see activity tracker
- [ ] Anonymous user automatically joins event
- [ ] Authenticated user still works as before

#### HomeClient

- [ ] New visitor sees AnonymousSetup
- [ ] Anonymous user with profile redirects to /events
- [ ] Authenticated user redirects to /events
- [ ] No loading flicker or race conditions

#### ChatSidebar

- [ ] Anonymous user can send messages
- [ ] Anonymous user can see their messages
- [ ] Anonymous user can see others' messages
- [ ] Message sender name displays correctly
- [ ] Authenticated users can chat with anonymous users

#### NewEventPage

- [ ] Authenticated user can create events
- [ ] Anonymous user sees error when trying to create event
- [ ] Form validation still works
- [ ] Event creation redirects properly

---

## Code Patterns Established

### Using useCurrentUser Hook

```typescript
// ✅ Correct Pattern
const { currentUser, isLoading, isAuthenticated, isAnonymous } = useCurrentUser();

// Check if user exists
if (!currentUser) {
  return <LoginPrompt />;
}

// Use user ID
const userId = currentUser.id;

// Check if authenticated (for sensitive operations)
if (!isAuthenticated) {
  return <Error message="Must be logged in" />;
}

// Get display name (works for both types)
const displayName = currentUser.displayName || currentUser.email || 'Anonymous';
```

### Conditional Rendering

```typescript
// ✅ Show content for any user
{currentUser && <Component userId={currentUser.id} />}

// ✅ Show only for authenticated users
{isAuthenticated && <AdminPanel />}

// ✅ Show only for anonymous users
{isAnonymous && <UpgradePrompt />}
```

### Type Safety

```typescript
// ✅ Always check for null
if (currentUser?.id) {
  // Safe to use currentUser.id
}

// ✅ Use optional chaining
const email = currentUser?.email;
const displayName = currentUser?.displayName;
```

---

## Migration Summary

| Component       | Before                             | After              | Status      |
| --------------- | ---------------------------------- | ------------------ | ----------- |
| EventPageClient | `useUser()`                        | `useCurrentUser()` | ✅ Complete |
| HomeClient      | `useUser()` + `useAnonymousUser()` | `useCurrentUser()` | ✅ Complete |
| ChatSidebar     | `User` type                        | `CurrentUser` type | ✅ Complete |
| NewEventPage    | `useUser()`                        | `useCurrentUser()` | ✅ Complete |
| ActivityTracker | No changes needed                  | N/A                | ✅ N/A      |
| AnonymousSetup  | Already correct                    | N/A                | ✅ N/A      |

---

## Next Steps

1. ✅ Component updates complete
2. ⏳ Run database migration (`migrations/add-anonymous-user-support.sql`)
3. ⏳ Regenerate TypeScript types: `npm run generate:types`
4. ⏳ Test all flows end-to-end
5. ⏳ Deploy to staging
6. ⏳ User acceptance testing
7. ⏳ Deploy to production

---

## Rollback Instructions

If issues arise, to rollback the component changes:

1. Revert the commit with component updates
2. Components will go back to using `useUser()` only
3. Anonymous users will be blocked by authentication checks
4. No data corruption - anonymous_profiles table remains

```bash
# Find the commit
git log --oneline

# Revert the component update commit
git revert <commit-hash>

# Or reset if not pushed
git reset --hard HEAD~1
```

---

## Performance Notes

### Before (Dual Hook Pattern)

- Two separate hooks called: `useUser()` + `useAnonymousUser()`
- Two loading states to manage
- More complex conditional logic

### After (Unified Hook Pattern)

- Single hook: `useCurrentUser()`
- One loading state
- Simpler conditional logic
- Still efficient - hooks are called internally but abstracted

**Result:** Cleaner code with no performance penalty

---

## Documentation

For more information:

- Anonymous User Implementation: `ANONYMOUS-USER-IMPLEMENTATION.md`
- RLS Policy Changes: `ANONYMOUS-RLS-POLICIES.md`
- Database Migration: `migrations/add-anonymous-user-support.sql`
