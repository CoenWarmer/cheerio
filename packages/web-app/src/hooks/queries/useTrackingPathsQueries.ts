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
  list: (eventSlug: string) =>
    [...trackingPathKeys.lists(), eventSlug] as const,
};

async function fetchTrackingPaths(eventSlug: string): Promise<TrackingPath[]> {
  const response = await fetch(`/api/events/${eventSlug}/tracking-paths`);
  if (!response.ok) {
    throw new Error('Failed to fetch tracking paths');
  }
  const result = await response.json();
  return result.data;
}

export function useTrackingPathsQuery(eventSlug: string) {
  return useQuery({
    queryKey: trackingPathKeys.list(eventSlug),
    queryFn: () => fetchTrackingPaths(eventSlug),
    enabled: !!eventSlug,
  });
}

export function useTrackingPathsRealtimeQuery(
  eventId: string,
  eventSlug: string
) {
  const queryClient = useQueryClient();
  const query = useTrackingPathsQuery(eventSlug);

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`tracking-paths-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
          filter: `event_id=eq.${eventId}`,
        },
        payload => {
          // Invalidate if it's a location or tracking activity
          const newActivity = payload.new as { activity_type: string };
          if (
            newActivity.activity_type === 'location' ||
            newActivity.activity_type === 'tracking'
          ) {
            queryClient.invalidateQueries({
              queryKey: trackingPathKeys.list(eventSlug),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, eventSlug, queryClient]);

  return query;
}
