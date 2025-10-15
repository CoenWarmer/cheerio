'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presenceApi } from '@/lib/api-client';
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
    refetchInterval: 30000, // Refetch every 30s as fallback
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
    }: {
      eventId: string;
      status?: 'online' | 'away';
    }) => presenceApi.update(eventId, status),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: presenceKeys.list(eventId) });
    },
  });
}

export function useRemovePresenceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => presenceApi.remove(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: presenceKeys.list(eventId) });
    },
  });
}
