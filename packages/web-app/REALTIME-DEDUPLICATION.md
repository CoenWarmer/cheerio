# Realtime Subscription Deduplication

## Problem

When React components re-render (especially in React Strict Mode during development), hooks that create Supabase Realtime subscriptions can be called multiple times. This leads to:

- Duplicate subscriptions to the same channel
- "Mismatch between server and client bindings" errors
- Performance issues and unnecessary network traffic
- Race conditions in data updates

## Solution

We've implemented a global subscription registry that ensures only one subscription exists per channel, regardless of how many times a component re-renders or how many components subscribe to the same channel.

### Components

1. **`realtimeRegistry`** (`src/lib/realtime-registry.ts`)
   - Global singleton that tracks active channels
   - Reference-counts subscribers
   - Only removes channels when the last subscriber unsubscribes

2. **`useRealtimeSubscription`** (`src/hooks/useRealtimeSubscription.ts`)
   - Reusable hook for creating subscriptions
   - Automatically handles deduplication
   - Simplified API for common use cases

### Usage

#### Option 1: Using the helper hook (Recommended)

```typescript
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

function MyComponent({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();

  const handleData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['messages', eventId] });
  }, [queryClient, eventId]);

  useRealtimeSubscription({
    channelName: `messages-${eventId}`,
    table: 'messages',
    event: '*',
    filter: `event_id=eq.${eventId}`,
    onData: handleData,
    enabled: !!eventId,
  });

  // ... rest of component
}
```

#### Option 2: Using the registry directly

```typescript
import { realtimeRegistry } from '@/lib/realtime-registry';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

function MyComponent({ eventId }: { eventId: string }) {
  useEffect(() => {
    if (!eventId) return;

    const channelKey = `messages-${eventId}`;

    // Get or create the channel (prevents duplicates)
    realtimeRegistry.getOrCreateChannel(channelKey, () =>
      supabase
        .channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `event_id=eq.${eventId}`,
          },
          () => {
            // Handle data
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.error('Subscription error:', err);
          }
        })
    );

    return () => {
      realtimeRegistry.unsubscribe(channelKey, channel =>
        supabase.removeChannel(channel)
      );
    };
  }, [eventId]);

  // ... rest of component
}
```

### Key Features

- **Automatic Deduplication**: Multiple calls with the same channel name share one subscription
- **Reference Counting**: Subscription is only closed when all subscribers have unsubscribed
- **React Strict Mode Safe**: Works correctly even with double-rendering in development
- **Type Safe**: Full TypeScript support
- **Debugging Support**: Methods to inspect active channels and subscriber counts

### Debugging

```typescript
import { realtimeRegistry } from '@/lib/realtime-registry';

// Get all active channel names
console.log(realtimeRegistry.getActiveChannels());

// Get subscriber count for a specific channel
console.log(realtimeRegistry.getSubscriberCount('messages-abc123'));
```

### Migration Guide

To update existing Realtime subscriptions to use the registry:

1. Import the registry:

   ```typescript
   import { realtimeRegistry } from '@/lib/realtime-registry';
   ```

2. Replace direct channel creation with registry:

   ```typescript
   // Before
   const channel = supabase.channel(channelName).on(...).subscribe();

   // After
   const channelKey = channelName;
   realtimeRegistry.getOrCreateChannel(channelKey, () =>
     supabase.channel(channelName).on(...).subscribe()
   );
   ```

3. Update cleanup:

   ```typescript
   // Before
   return () => supabase.removeChannel(channel);

   // After
   return () => {
     realtimeRegistry.unsubscribe(channelKey, channel =>
       supabase.removeChannel(channel)
     );
   };
   ```

### Files Updated

- ✅ `src/hooks/queries/useActivityQueries.ts` - Uses registry for activity subscriptions
- 🔄 `src/hooks/queries/useMessagesQueries.ts` - Can be updated to use registry
- 🔄 `src/hooks/queries/usePresenceQueries.ts` - Can be updated to use registry
- 🔄 `src/hooks/queries/useTrackingPathsQueries.ts` - Can be updated to use registry
- 🔄 `src/hooks/queries/useActivitySummaryQueries.ts` - Can be updated to use registry
