# API Architecture

The frontend now uses Next.js API routes instead of calling Supabase directly. This provides better security, centralized logic, and easier maintenance.

## Architecture Overview

```
Frontend Components
       ↓
  API Client (api-client.ts)
       ↓
  Next.js API Routes (/app/api/*)
       ↓
  Supabase Database
```

## API Routes

### Rooms

**GET `/api/rooms`**

- Get all rooms
- Returns: `{ data: Room[] }`

**GET `/api/rooms/[id]`**

- Get a single room by ID
- Returns: `{ data: Room }`
- Error: `404` if room not found

**POST `/api/rooms`**

- Create a new room
- Body:
  ```json
  {
    "name": "Room Title",
    "description": "Optional description",
    "donation_link": "https://...",
    "start_time": "2024-01-01T00:00:00Z",
    "status": "awaiting",
    "is_private": false,
    "created_by": "user-id",
    "location": "POINT(lng lat)"
  }
  ```
- Returns: `{ data: Room }`

### Messages

**GET `/api/rooms/[id]/messages`**

- Get messages for a specific room
- Returns: `{ data: Message[] }`

**POST `/api/rooms/[id]/messages`**

- Create a new message in a room
- Body:
  ```json
  {
    "content": "Message text",
    "user_id": "user-id",
    "attachment": null
  }
  ```
- Returns: `{ data: Message }`

## API Client

The `api-client.ts` file provides a typed interface for making API calls:

```typescript
import { roomsApi, messagesApi } from '@/lib/api-client';

// Get all rooms
const { data } = await roomsApi.getAll();

// Get single room
const { data } = await roomsApi.getById(roomId);

// Create room
const { data } = await roomsApi.create(roomData);

// Get messages
const { data } = await messagesApi.getByRoomId(roomId);

// Create message
const { data } = await messagesApi.create(roomId, messageData);
```

## Error Handling

The API client throws `ApiError` for failed requests:

```typescript
try {
  const result = await roomsApi.getById(id);
} catch (err) {
  if (err instanceof ApiError) {
    console.error(`Error ${err.status}: ${err.message}`);
  }
}
```

## Benefits of This Architecture

### ✅ Security

- API keys and database credentials stay on the server
- Can add authentication/authorization at the API layer
- Rate limiting can be implemented at the API level

### ✅ Centralized Logic

- Business logic in one place (API routes)
- Easier to maintain and test
- Can add caching, logging, etc.

### ✅ Flexibility

- Can switch databases without changing frontend code
- Can add additional data sources
- API versioning is easier

### ✅ Type Safety

- Single source of truth for API contracts
- TypeScript types for all API calls
- Better IDE autocomplete

## What Still Uses Supabase Directly

### Real-time Subscriptions

The ChatSidebar still uses Supabase Realtime for instant message updates:

```typescript
const channel = supabase
  .channel(`room-${roomId}`)
  .on('postgres_changes', ...)
  .subscribe();
```

This is necessary because:

- Real-time requires direct WebSocket connection
- Next.js API routes are request/response based
- Supabase Realtime handles the complexity of WebSocket connections

### Authentication

Auth still uses Supabase client directly:

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();
```

This is fine because:

- Supabase handles auth securely client-side
- JWT tokens are used for authorization
- No sensitive credentials exposed

## Future Enhancements

### 1. Add Middleware for Auth

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Verify JWT token
  // Add user info to request
}
```

### 2. Add Request Validation

```typescript
import { z } from 'zod';

const createRoomSchema = z.object({
  name: z.string().min(1).max(255),
  // ...
});
```

### 3. Add Caching

```typescript
import { cache } from 'react';

export const getRooms = cache(async () => {
  // Cached for duration of request
});
```

### 4. Add Rate Limiting

```typescript
import rateLimit from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  await rateLimit(request);
  // ... rest of handler
}
```

## Testing API Routes

You can test API routes directly:

```bash
# Get all rooms
curl http://localhost:3000/api/rooms

# Create a room
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room","created_by":"user-id"}'

# Get single room
curl http://localhost:3000/api/rooms/[room-id]
```

## Migration Notes

The following components were updated to use API routes:

- ✅ `/app/new/page.tsx` - Create room form
- ✅ `/app/rooms/page.tsx` - Rooms list
- ✅ `/app/room/[id]/page.tsx` - Single room view
- ✅ `/components/ChatSidebar.tsx` - Messages (still uses Realtime for subscriptions)

Authentication components still use Supabase directly and don't need changes.
