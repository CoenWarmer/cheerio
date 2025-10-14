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
          queryClient.invalidateQueries({
            queryKey: activityKeys.list(roomSlug, filters),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, roomSlug, queryClient, filters]);

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
