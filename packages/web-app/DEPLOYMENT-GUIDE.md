# Anonymous User Support - Deployment Guide

## 🎯 Quick Overview

This guide walks through deploying the anonymous user feature to Cheerio. Anonymous users can participate in events without creating an account - they only need to provide a display name.

---

## ✅ What's Complete

### 1. Database Schema

- ✅ `migrations/create-anonymous-profiles.sql` - Anonymous profiles table
- ✅ `migrations/add-anonymous-user-support.sql` - RLS policy updates
- ✅ `migrations/remove-event-members-fk-constraint.sql` - Remove FK constraints for anonymous support

### 2. Application Code

- ✅ `src/lib/api/anonymousProfiles.ts` - CRUD API for anonymous profiles
- ✅ `src/lib/anonymousUser.ts` - localStorage management
- ✅ `src/hooks/useAnonymousUser.ts` - Anonymous user state hook
- ✅ `src/hooks/useCurrentUser.ts` - Unified user hook
- ✅ `src/components/AnonymousSetup.tsx` - Onboarding UI
- ✅ `src/components/HomeClient.tsx` - Smart routing

### 3. Component Updates

- ✅ EventPageClient - Now uses `useCurrentUser()`
- ✅ HomeClient - Simplified with unified hook
- ✅ ChatSidebar - Accepts `CurrentUser` type
- ✅ NewEventPage - Uses `useCurrentUser()` with auth check

### 4. Internationalization

- ✅ English (en.json)
- ✅ Dutch (nl.json)
- ✅ Russian (ru.json)
- ✅ Spanish (es.json)
- ✅ French (fr.json)

### 5. Documentation

- ✅ ANONYMOUS-USER-IMPLEMENTATION.md - Feature overview
- ✅ ANONYMOUS-RLS-POLICIES.md - Security details
- ✅ COMPONENT-UPDATES.md - Technical changes
- ✅ This deployment guide

---

## 🚀 Deployment Steps

### Step 1: Run Database Migrations

#### 1.1 Create Anonymous Profiles Table

```bash
# 1. Open Supabase SQL Editor
# https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

# 2. Copy and run migrations/create-anonymous-profiles.sql
```

**Expected Output:**

```
NOTICE: ✅ Table created: anonymous_profiles
NOTICE: ✅ RLS enabled on anonymous_profiles
NOTICE: ✅ Policies created for public access
NOTICE: ✅ Updated_at trigger added
```

**Verify:**

```sql
-- Check table exists
SELECT * FROM anonymous_profiles LIMIT 1;

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'anonymous_profiles';
```

#### 1.2 Update RLS Policies

```bash
# 1. In Supabase SQL Editor
# 2. Copy and run migrations/add-anonymous-user-support.sql
```

**Expected Output:**

```
NOTICE: ========================================================
NOTICE: ✅ Migration complete: Anonymous user support enabled
NOTICE: ========================================================
NOTICE: Tables updated:
NOTICE:   - events (public read access)
NOTICE:   - event_members (public join/leave access)
NOTICE:   - messages (public read/write access)
NOTICE:   - presence (public read/write access)
NOTICE:   - user_activity (public access if exists)
NOTICE:
NOTICE: ⚠️  IMPORTANT: Application layer must validate user ownership
NOTICE: ========================================================
```

**Verify:**

```sql
-- Check events policies
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'events';

-- Check event_members policies
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'event_members';

-- Check messages policies
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'messages';

-- Check presence policies
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'presence';
```

#### 1.3 Remove Foreign Key Constraints

```bash
# 1. In Supabase SQL Editor
# 2. Copy and run migrations/remove-event-members-fk-constraint.sql
```

**Why This is Needed:**

- `event_members.user_id` previously had a foreign key to `profiles.id`
- Anonymous users have IDs in `anonymous_profiles.id`, not `profiles.id`
- PostgreSQL doesn't support multiple FK targets, so we remove the constraint
- Data integrity is enforced by RLS policies and application validation

**Expected Output:**

```
NOTICE: ✅ Dropped constraint: room_members_user_id_fkey
NOTICE: ✅ Dropped constraint: messages_user_id_fkey from messages table
NOTICE: ✅ Dropped constraint: presence_user_id_fkey from presence table
NOTICE: ========================================================
NOTICE: ✅ SUCCESS: All user_id foreign key constraints removed
NOTICE: ========================================================
```

**Verify:**

```sql
-- Check that FK constraints are gone
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_name LIKE '%user_id_fkey'
AND table_name IN ('event_members', 'messages', 'presence');
-- Should return no rows
```

---

### Step 2: Regenerate TypeScript Types

```bash
cd packages/web-app

# Run type generation
npm run generate:types

# Or if that doesn't work:
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

**Expected Changes:**

- `database.types.ts` should now include `anonymous_profiles` table
- TypeScript errors in `anonymousProfiles.ts` should disappear

**Verify:**

```bash
# Check for TypeScript errors
npm run type-check

# Or
npx tsc --noEmit
```

---

### Step 3: Test Locally

#### 3.1 Start Development Server

```bash
npm run dev
```

#### 3.2 Test Anonymous User Flow

**Test 1: New Visitor**

1. Open http://localhost:3000 in incognito/private window
2. Should see "Welcome to Cheerio" with two options
3. Click "Continue Anonymously"
4. Enter a display name
5. Click "Get Started"
6. Should redirect to /events

**Test 2: Anonymous User Persistence**

1. After completing Test 1, refresh the page
2. Should stay on /events (not redirect back to setup)
3. Check localStorage in DevTools:
   - `cheerio_anonymous_id` should have a UUID
   - `cheerio_anonymous_name` should have your display name

**Test 3: Join Event**

1. As anonymous user, click on an event
2. Should see event map, chat, and activity tracker
3. Event should show you as a participant

**Test 4: Send Message**

1. In event page, open chat sidebar
2. Type a message and send
3. Message should appear with your display name
4. Check messages table - should have your anonymous_profiles.id as user_id

**Test 5: Authenticated User Still Works**

1. Sign out if logged in
2. Click "Create Account" instead of anonymous
3. Complete registration
4. All features should work as before

**Test 6: Cross-User Chat**

1. Open event in regular window as authenticated user
2. Open same event in incognito as anonymous user
3. Send messages from both
4. Both should see each other's messages

---

### Step 4: Run Pre-Deployment Checks

```bash
# 1. Check for TypeScript errors
npm run type-check

# 2. Run linter
npm run lint

# 3. Build for production (catches build-time errors)
npm run build

# 4. Check for console errors in development
# Open browser DevTools → Console tab
# Look for any red errors
```

**All checks should pass before deploying**

---

### Step 5: Deploy to Staging (if available)

```bash
# Deploy to Vercel staging
vercel --prod=false

# Or your staging deployment command
```

**Staging Tests:**

1. Repeat all tests from Step 3
2. Test on mobile devices
3. Test on different browsers (Chrome, Firefox, Safari)
4. Test with slow network (DevTools → Network → Slow 3G)

---

### Step 6: Deploy to Production

```bash
# Deploy to Vercel production
vercel --prod

# Or via Git push (if auto-deploy enabled)
git push origin main
```

**Post-Deploy Verification:**

1. Visit production URL
2. Test anonymous user flow (incognito window)
3. Check Supabase logs for any errors
4. Monitor Vercel logs

---

## 🧪 Testing Checklist

### Core Functionality

- [ ] New visitor sees AnonymousSetup
- [ ] Can choose "Continue Anonymously"
- [ ] Can enter display name
- [ ] Redirects to /events after setup
- [ ] Anonymous user persists on page refresh
- [ ] Can view events list
- [ ] Can view event details
- [ ] Can join events
- [ ] Can see event map
- [ ] Can send messages in chat
- [ ] Can see other users' messages
- [ ] Can track activity (if permissions allow)

### Authenticated Users

- [ ] Can still register normally
- [ ] Can sign in normally
- [ ] All existing features work
- [ ] Can interact with anonymous users
- [ ] Can see anonymous users in chat
- [ ] Can create events (anonymous users cannot)

### Edge Cases

- [ ] Clearing localStorage removes anonymous identity
- [ ] Can create new anonymous identity after clearing
- [ ] Multiple tabs share same anonymous identity
- [ ] Anonymous user can't create events (shows error)
- [ ] Long display names handle gracefully
- [ ] Emoji display names work
- [ ] Network offline/online transitions

### Security

- [ ] Anonymous user IDs are real UUIDs (check localStorage)
- [ ] Can't spoof another user's ID (test in DevTools)
- [ ] Messages save with correct user_id
- [ ] Event members save with correct user_id
- [ ] Authenticated-only features blocked for anonymous users

### Performance

- [ ] No console errors
- [ ] No infinite loops or re-renders
- [ ] Page loads quickly
- [ ] No memory leaks (check DevTools Memory tab)
- [ ] Smooth transitions between pages

### Mobile

- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Touch interactions work
- [ ] Responsive layout
- [ ] No layout shifts

---

## 🐛 Troubleshooting

### Issue: "Cannot find table anonymous_profiles"

**Cause:** Migration not run or types not regenerated

**Fix:**

```bash
# 1. Check table exists in Supabase dashboard
# 2. Regenerate types
npm run generate:types
```

---

### Issue: "violates foreign key constraint room_members_user_id_fkey"

**Cause:** The `event_members` table has a foreign key constraint pointing to `profiles.id`, but anonymous user IDs are in `anonymous_profiles.id`.

**Fix:**

```bash
# Run the migration to remove FK constraints
# In Supabase SQL Editor: migrations/remove-event-members-fk-constraint.sql
```

**Why it's safe:**

- RLS policies still enforce security
- Application validates user IDs via `useCurrentUser()` hook
- UUID format validation prevents invalid IDs
- Trade-off: Database referential integrity → Application-layer validation

---

### Issue: Anonymous user can't send messages

**Cause:** RLS policy not updated or FK constraint blocking insert

**Fix:**

```bash
# 1. Run add-anonymous-user-support.sql migration
# 2. Check policies in Supabase dashboard
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

---

### Issue: "User must be authenticated" error

**Cause:** Component still using old `useUser()` hook

**Fix:**

```typescript
// Update component to use useCurrentUser
import { useCurrentUser } from '@/hooks/useCurrentUser';

const { currentUser } = useCurrentUser();
```

---

### Issue: Anonymous user redirects to sign-in

**Cause:** Auth check too strict

**Fix:**

```typescript
// Before (wrong)
if (!user) {
  router.push('/sign-in');
}

// After (correct)
const { currentUser } = useCurrentUser();
if (!currentUser) {
  // Show setup, don't force sign-in
}
```

---

### Issue: TypeScript errors in anonymousProfiles.ts

**Cause:** Types not regenerated after migration

**Fix:**

```bash
npm run generate:types
```

**Temporary workaround:**

```typescript
// Already added in code:
// @ts-ignore or (as any) type assertions
// Will be removed after type regeneration
```

---

### Issue: LocalStorage not persisting

**Cause:** Browser privacy settings or incognito mode issue

**Check:**

```javascript
// In browser console
console.log(localStorage.getItem('cheerio_anonymous_id'));
console.log(localStorage.getItem('cheerio_anonymous_name'));
```

**Fix:**

- Check browser privacy settings
- Try different browser
- Clear site data and try again

---

## 📊 Monitoring

### What to Monitor After Deployment

1. **Supabase Dashboard**
   - Watch for RLS policy violations
   - Check anonymous_profiles table growth
   - Monitor message creation rate

2. **Application Logs (Vercel/Netlify)**
   - Look for failed API calls
   - Check for localStorage errors
   - Monitor page load times

3. **User Metrics**
   - Anonymous user signup rate
   - Anonymous → Authenticated conversion rate
   - Chat message volume
   - Event participation rate

4. **Error Tracking (if enabled)**
   - Sentry, LogRocket, etc.
   - Watch for uncaught exceptions
   - Monitor user sessions

---

## 📈 Success Metrics

### Week 1 Post-Launch

- [ ] No critical bugs reported
- [ ] Anonymous users successfully joining events
- [ ] Messages being sent by anonymous users
- [ ] No RLS policy violations in logs
- [ ] Page load times unchanged

### Month 1 Post-Launch

- [ ] X% of new users choose anonymous option
- [ ] Y% of anonymous users return
- [ ] Z% of anonymous users upgrade to accounts
- [ ] Overall user engagement increased

---

## 🔄 Rollback Plan

If critical issues arise:

### Database Rollback

```sql
-- 1. Remove public policies
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Anyone can join events" ON event_members;
DROP POLICY IF EXISTS "Anyone can read messages" ON messages;

-- 2. Restore authenticated-only policies
CREATE POLICY "Users can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- (Continue for other tables...)
```

### Code Rollback

```bash
# Revert to commit before changes
git log --oneline
git revert <commit-hash>
git push origin main
```

### Quick Disable (No Code Changes)

```sql
-- Disable anonymous_profiles table access
ALTER TABLE anonymous_profiles DISABLE ROW LEVEL SECURITY;

-- This blocks anonymous users immediately
-- Authenticated users continue working
```

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Client-Side Data Fetching](https://nextjs.org/docs/basic-features/data-fetching/client-side)
- [localStorage Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

## ✅ Post-Deployment

After successful deployment:

1. [ ] Update team documentation
2. [ ] Announce feature to users
3. [ ] Create user guide/FAQ
4. [ ] Plan "Upgrade to Account" feature
5. [ ] Gather user feedback
6. [ ] Iterate based on metrics

---

## 🎉 Conclusion

You're now ready to deploy anonymous user support! This feature will:

- ✅ Lower barrier to entry for new users
- ✅ Increase event participation
- ✅ Provide privacy-focused option
- ✅ Enable "try before you buy" experience

Good luck with the deployment! 🚀
