'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityApi } from '@/lib/activity-client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ActivityFilters, CreateActivityInput } from '@/types/activity';

export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (eventSlug: string, filters?: ActivityFilters) =>
    [...activityKeys.lists(), eventSlug, filters] as const,
};

export function useActivitiesQuery(
  eventSlug: string,
  filters?: ActivityFilters
) {
  return useQuery({
    queryKey: activityKeys.list(eventSlug, filters),
    queryFn: () => activityApi.getActivities(eventSlug, filters),
    enabled: !!eventSlug,
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: true,
  });
}

export function useActivitiesRealtimeQuery(
  eventId: string,
  eventSlug: string,
  filters?: ActivityFilters
) {
  const queryClient = useQueryClient();

  const query = useActivitiesQuery(eventSlug, filters);

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`activity-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // Invalidate all activity queries for this event
          // This will trigger a refetch with the current filters
          queryClient.invalidateQueries({
            queryKey: activityKeys.lists(),
            predicate: query => query.queryKey.includes(eventSlug),
          });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Realtime subscription error:', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // Only depend on eventId and eventSlug - these should be stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, eventSlug]);

  return query;
}

export function useCreateActivityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventSlug,
      activity,
    }: {
      eventSlug: string;
      activity: CreateActivityInput;
    }) => activityApi.createActivity(eventSlug, activity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}
