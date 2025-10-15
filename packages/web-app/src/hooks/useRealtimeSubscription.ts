/**
 * Reusable hook for creating Realtime subscriptions with automatic deduplication
 *
 * This hook ensures that only one subscription exists per channel,
 * even if the component re-renders or is mounted multiple times.
 */

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { realtimeRegistry } from '@/lib/realtime-registry';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface UseRealtimeSubscriptionOptions {
  channelName: string;
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
  onData: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void;
  enabled?: boolean;
}

/**
 * Subscribe to Realtime changes with automatic deduplication
 *
 * @example
 * useRealtimeSubscription({
 *   channelName: `messages-${eventId}`,
 *   table: 'messages',
 *   event: '*',
 *   filter: `event_id=eq.${eventId}`,
 *   onData: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
 *   enabled: !!eventId,
 * });
 */
export function useRealtimeSubscription({
  channelName,
  table,
  event = '*',
  schema = 'public',
  filter,
  onData,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  useEffect(() => {
    if (!enabled) return;

    // Get or create the channel (prevents duplicates)
    realtimeRegistry.getOrCreateChannel(channelName, () => {
      const channel = supabase.channel(channelName);

      return channel
        .on(
          'postgres_changes' as never,
          {
            event,
            schema,
            table,
            filter,
          } as never,
          onData as never
        )
        .subscribe((status, err) => {
          if (err) {
            console.error(`Realtime subscription error (${channelName}):`, err);
          }
        });
    });

    return () => {
      realtimeRegistry.unsubscribe(channelName, channel =>
        supabase.removeChannel(channel)
      );
    };
    // We intentionally only depend on channelName and enabled
    // The callback should be stable or wrapped in useCallback by the consumer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled]);
}
