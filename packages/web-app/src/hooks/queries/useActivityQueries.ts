'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityApi } from '@/lib/activity-client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ActivityFilters, CreateActivityInput } from '@/types/activity';

export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (roomSlug: string, filters?: ActivityFilters) =>
    [...activityKeys.lists(), roomSlug, filters] as const,
};

export function useActivitiesQuery(
  roomSlug: string,
  filters?: ActivityFilters
) {
  return useQuery({
    queryKey: activityKeys.list(roomSlug, filters),
    queryFn: () => activityApi.getActivities(roomSlug, filters),
    enabled: !!roomSlug,
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: true,
  });
}

export function useActivitiesRealtimeQuery(
  roomId: string,
  roomSlug: string,
  filters?: ActivityFilters
) {
  const queryClient = useQueryClient();

  const query = useActivitiesQuery(roomSlug, filters);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`activity-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Invalidate all activity queries for this room
          // This will trigger a refetch with the current filters
          queryClient.invalidateQueries({
            queryKey: activityKeys.lists(),
            predicate: query => query.queryKey.includes(roomSlug),
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
    // Only depend on roomId and roomSlug - these should be stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roomSlug]);

  return query;
}

export function useCreateActivityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomSlug,
      activity,
    }: {
      roomSlug: string;
      activity: CreateActivityInput;
    }) => activityApi.createActivity(roomSlug, activity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}
