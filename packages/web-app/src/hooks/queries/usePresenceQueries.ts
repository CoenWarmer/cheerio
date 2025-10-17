'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presenceApi } from '@/lib/api/presence-api';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const presenceKeys = {
  all: ['presence'] as const,
  lists: () => [...presenceKeys.all, 'list'] as const,
  list: (eventSlug: string) => [...presenceKeys.lists(), eventSlug] as const,
};

export function usePresenceQuery(eventSlug: string) {
  return useQuery({
    queryKey: presenceKeys.list(eventSlug),
    queryFn: () => presenceApi.getActive(eventSlug),
    enabled: !!eventSlug,
    // No polling needed - realtime subscriptions handle all updates
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

export function usePresenceRealtimeQuery(eventId: string, eventSlug: string) {
  const queryClient = useQueryClient();

  const query = usePresenceQuery(eventSlug);

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`presence-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: presenceKeys.list(eventSlug),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, eventSlug, queryClient]);

  return query;
}

export function useUpdatePresenceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      status,
      userId,
    }: {
      eventId: string;
      status?: 'online' | 'away';
      userId?: string;
    }) => presenceApi.update(eventId, status, userId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: presenceKeys.list(eventId) });
    },
  });
}

export function useRemovePresenceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId?: string }) =>
      presenceApi.remove(eventId, userId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: presenceKeys.list(eventId) });
    },
  });
}
