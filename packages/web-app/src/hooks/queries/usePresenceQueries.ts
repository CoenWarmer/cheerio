'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presenceApi } from '@/lib/api-client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const presenceKeys = {
  all: ['presence'] as const,
  lists: () => [...presenceKeys.all, 'list'] as const,
  list: (roomSlug: string) => [...presenceKeys.lists(), roomSlug] as const,
};

export function usePresenceQuery(roomSlug: string) {
  return useQuery({
    queryKey: presenceKeys.list(roomSlug),
    queryFn: () => presenceApi.getActive(roomSlug),
    enabled: !!roomSlug,
    refetchInterval: 30000, // Refetch every 30s as fallback
  });
}

export function usePresenceRealtimeQuery(roomId: string, roomSlug: string) {
  const queryClient = useQueryClient();

  const query = usePresenceQuery(roomSlug);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`presence-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: presenceKeys.list(roomSlug),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, roomSlug, queryClient]);

  return query;
}

export function useUpdatePresenceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      status,
    }: {
      roomId: string;
      status?: 'online' | 'away';
    }) => presenceApi.update(roomId, status),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: presenceKeys.list(roomId) });
    },
  });
}

export function useRemovePresenceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => presenceApi.remove(roomId),
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: presenceKeys.list(roomId) });
    },
  });
}
