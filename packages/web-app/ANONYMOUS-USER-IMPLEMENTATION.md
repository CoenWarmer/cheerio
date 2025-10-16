# Anonymous User Support Implementation

## Overview

This implementation adds support for anonymous users who can use Cheerio without creating an account. Anonymous users only need to provide a display name and their identity is stored in browser localStorage.

## ✅ Completed Implementation

### 1. Database Migration

**`migrations/create-anonymous-profiles.sql`**

- Creates `anonymous_profiles` table with:
  - `id` (UUID, primary key)
  - `display_name` (text, required)
  - `created_at`, `updated_at` (timestamps)
- Enables RLS with policies for public read/create/update/delete
- Auto-updates `updated_at` timestamp

**Status:** ✅ Created - Ready to run in Supabase

### 2. API Layer

**`src/lib/api/anonymousProfiles.ts`**

- CRUD operations for anonymous profiles:
  - `create(displayName)` - Create new anonymous profile
  - `get(id)` - Fetch anonymous profile by ID
  - `update(id, updates)` - Update display name
  - `delete(id)` - Delete anonymous profile

**Status:** ✅ Complete

### 3. Browser Storage Utility

**`src/lib/anonymousUser.ts`**

- Manages localStorage for anonymous user state:
  - `getId()` / `setId(id)` - Manage anonymous ID
  - `getName()` / `setName(name)` - Manage display name
  - `clear()` - Remove all anonymous data
  - `isAnonymous()` - Check if user is anonymous

**Status:** ✅ Complete

### 4. React Hooks

**`src/hooks/useAnonymousUser.ts`**

- Provides interface for managing anonymous users:
  ```typescript
  const {
    anonymousId,
    anonymousProfile,
    isAnonymous,
    isLoading,
    createAnonymousProfile,
    updateAnonymousProfile,
    clearAnonymousData,
  } = useAnonymousUser();
  ```

**`src/hooks/useCurrentUser.ts`** ✅ NEW

- Unified hook that works with both authenticated and anonymous users:
  ```typescript
  const {
    currentUser, // Unified user object
    isLoading,
    isAuthenticated,
    isAnonymous,
  } = useCurrentUser();
  ```

**Status:** ✅ Complete

### 5. UI Components

**`src/components/AnonymousSetup.tsx`** ✅ NEW

- Two-step flow:
  1. **Choose Step**: User selects "Continue Anonymously" or "Create Account"
  2. **Setup Step**: Anonymous users enter their display name
- Beautiful card-based UI with emoji icons
- Fully internationalized

**`src/components/HomeClient.tsx`** ✅ NEW

- Smart routing logic:
  - Authenticated users → Redirect to /events
  - Anonymous users with profile → Redirect to /events
  - New visitors → Show AnonymousSetup

**Status:** ✅ Complete

### 6. Translations

Added to **all 5 languages** (English, Dutch, Russian, Spanish, French):

- `auth.anonymous.title` - "Welcome to Cheerio"
- `auth.anonymous.subtitle` - "Choose how you'd like to get started"
- `auth.anonymous.continueAnonymously` - "Continue Anonymously"
- `auth.anonymous.anonymousDescription` - Description text
- `auth.anonymous.createAccount` - "Create an Account"
- `auth.anonymous.accountDescription` - Description text
- `auth.anonymous.alreadyHaveAccount` - "Already have an account?"
- `auth.anonymous.signIn` - "Sign In"
- `auth.anonymous.setupTitle` - "Just One More Thing..."
- `auth.anonymous.setupSubtitle` - "What should we call you?"
- `auth.anonymous.displayName` - "Display Name"
- `auth.anonymous.displayNamePlaceholder` - "Your nickname"
- `auth.anonymous.displayNameRequired` - Error message
- `auth.anonymous.getStarted` - "Get Started"
- `auth.anonymous.creating` - "Creating profile..."

**Status:** ✅ Complete for all 5 languages

### 7. Updated Pages

**`src/app/[locale]/page.tsx`** ✅ UPDATED

- Now uses `HomeClient` component
- Handles routing based on user state

**Status:** ✅ Complete

## 📋 Remaining Steps

### 1. Run Database Migration ⏳

Execute `migrations/create-anonymous-profiles.sql` in Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy contents of `migrations/create-anonymous-profiles.sql`
3. Click "Run"

### 2. Regenerate TypeScript Types ⏳

After running migration:

```bash
cd packages/web-app
npm run generate:types
```

This will add `anonymous_profiles` to the Supabase types and remove TypeScript errors.

### 3. Update Event/Chat Components ⏳

Components that currently use `useUser()` should be updated to use `useCurrentUser()`:

**Components to update:**

- `src/components/ChatSidebar.tsx`
- `src/components/ActivityTracker.tsx`
- `src/components/EventPageClient.tsx`
- Any other components that check authentication

**Example refactor:**

```typescript
// Before
const { user } = useUser();
const userId = user?.id;
const userName = user?.email;

// After
const { currentUser } = useCurrentUser();
const userId = currentUser?.id;
const userName = currentUser?.displayName || currentUser?.email;
```

### 4. Update Events Page ⏳

Allow anonymous users to:

- View events list
- Join events
- See event details

### 5. Add "Upgrade to Account" Flow ⏳

Create a component for anonymous users to register an account:

- Keep their display name
- Add email and password
- Optionally migrate their activity
- Clear anonymous data after successful registration

## 🎯 User Flows

### New Visitor Flow

1. Visit home page (`/`)
2. See choice: "Continue Anonymously" or "Create Account"
3. **If anonymous**: Enter display name → Redirect to /events
4. **If register**: Go to /register → Complete registration → Setup profile → Redirect to /events

### Anonymous User Flow

1. Browse events
2. Join events
3. Chat with others (shows display name)
4. Track activity
5. (Optional) Upgrade to full account at any time

### Registered User Flow

1. Visit home page
2. Auto-redirect to /events (already logged in)
3. Full access to all features

## 🔧 Technical Implementation Details

### localStorage Schema

```javascript
{
  "cheerio_anonymous_id": "uuid-v4-string",
  "cheerio_anonymous_name": "User's Display Name"
}
```

### Database Schema

```sql
CREATE TABLE anonymous_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### useCurrentUser Hook

This is the key hook that unifies authenticated and anonymous users:

```typescript
interface CurrentUser {
  id: string; // User or anonymous ID
  displayName: string | null; // From profile or metadata
  email: string | null; // Only for authenticated
  avatarUrl: string | null; // Only for authenticated
  isAuthenticated: boolean;
  isAnonymous: boolean;
}
```

## ✅ Benefits

- ✅ **Lower barrier to entry** - No email required to try the app
- ✅ **Privacy-focused** - Anonymous option respects user privacy
- ✅ **Easy upgrade path** - Can register later without losing data
- ✅ **Better UX** - Try before commit
- ✅ **Fully internationalized** - Works in all 5 supported languages

## 🎨 UI Flow

### Choose Step

Users see two beautiful cards:

- 🎭 **Continue Anonymously** - Join without creating an account
- 🔐 **Create an Account** - Register to save your data

### Setup Step

Anonymous users enter their display name in a simple form

## 🔐 Security Considerations

- Anonymous profiles are public (anyone can read)
- No sensitive data stored in anonymous profiles
- localStorage is browser-specific (not shared across devices)
- Clearing browser data removes anonymous identity
- No way to recover anonymous identity if lost

## 📝 Notes for Developers

- TypeScript errors in `anonymousProfiles.ts` are expected until migration is run
- Always use `useCurrentUser()` in new components for unified user handling
- Remember to handle both `null` currentUser and anonymous vs authenticated states
- Anonymous users can do everything except features that require persistence across devices
