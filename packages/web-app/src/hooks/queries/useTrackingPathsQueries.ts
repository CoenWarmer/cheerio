'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface TrackingPath {
  userId: string;
  userName?: string;
  coordinates: Array<{ lat: number; lng: number; timestamp: string }>;
  color: string;
}

export const trackingPathKeys = {
  all: ['tracking-paths'] as const,
  lists: () => [...trackingPathKeys.all, 'list'] as const,
  list: (roomSlug: string) => [...trackingPathKeys.lists(), roomSlug] as const,
};

async function fetchTrackingPaths(roomSlug: string): Promise<TrackingPath[]> {
  const response = await fetch(`/api/rooms/${roomSlug}/tracking-paths`);
  if (!response.ok) {
    throw new Error('Failed to fetch tracking paths');
  }
  const result = await response.json();
  return result.data;
}

export function useTrackingPathsQuery(roomSlug: string) {
  return useQuery({
    queryKey: trackingPathKeys.list(roomSlug),
    queryFn: () => fetchTrackingPaths(roomSlug),
    enabled: !!roomSlug,
  });
}

export function useTrackingPathsRealtimeQuery(
  roomId: string,
  roomSlug: string
) {
  const queryClient = useQueryClient();
  const query = useTrackingPathsQuery(roomSlug);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`tracking-paths-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
          filter: `room_id=eq.${roomId}`,
        },
        payload => {
          // Invalidate if it's a location or tracking activity
          const newActivity = payload.new as { activity_type: string };
          if (
            newActivity.activity_type === 'location' ||
            newActivity.activity_type === 'tracking'
          ) {
            queryClient.invalidateQueries({
              queryKey: trackingPathKeys.list(roomSlug),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, roomSlug, queryClient]);

  return query;
}
