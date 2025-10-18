# Security Fix: User ID Validation

## 🚨 **Vulnerability Fixed**

With relaxed RLS policies for anonymous users, there was a critical impersonation vulnerability where:

- Any client could see `user_id` values in API responses
- Any client could POST with **someone else's** `user_id`
- No server-side validation prevented impersonation

## ✅ **Solution Implemented**

Created centralized validation function: `lib/validate-user-id.ts`

**How it works:**

1. **Authenticated users**: MUST use their auth session ID (ignores client-provided)
2. **Anonymous users**: Verifies the profile exists in `anonymous_profiles` before trusting the ID
3. **Returns 403 Forbidden** if validation fails

## 📝 **Fixed Endpoints**

All endpoints that accept `user_id` from clients now use `validateUserId()`:

✅ `/api/events/[slug]/messages` (POST)
✅ `/api/events/[slug]/presence` (POST, DELETE)
✅ `/api/events/[slug]/join` (POST)
✅ `/api/attachments/upload` (POST)

## 🔒 **Before vs After**

### Before (Vulnerable):

```typescript
// ❌ Accepts any user_id from client
const userId = user_id || user?.id;
```

### After (Secure):

```typescript
// ✅ Validates before trusting
const { userId, error } = await validateUserId(supabase, user_id);
if (!userId || error) {
  return NextResponse.json({ error }, { status: 403 });
}
```

## 🛡️ **Security Guarantees**

1. **Authenticated users** cannot be impersonated (session is source of truth)
2. **Anonymous users** cannot impersonate each other (profile existence verified)
3. **Malicious clients** cannot create data under someone else's ID
4. **API returns 403** instead of accepting invalid IDs

## 📊 **Impact**

- **Severity**: Critical (fixed)
- **Affected**: All write operations with anonymous user support
- **Risk**: User impersonation, data attribution attacks
- **Status**: ✅ Mitigated

## ✨ **Best Practice**

Always use `validateUserId()` in any new API endpoint that:

- Accepts `user_id` from client
- Supports anonymous users
- Performs writes attributed to a user

```typescript
import { validateUserId } from '@/lib/validate-user-id';

// In your route handler:
const { userId, error: userIdError } = await validateUserId(
  supabase,
  clientProvidedUserId
);

if (!userId || userIdError) {
  return NextResponse.json(
    { error: userIdError || 'User ID required' },
    { status: 403 }
  );
}
```
