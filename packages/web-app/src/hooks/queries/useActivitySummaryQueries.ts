'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserActivitySummary {
  userId: string;
  userName?: string;
  lastLocation?: {
    lat: number;
    long: number;
    accuracy?: number;
    timestamp: string;
  };
  lastSpeed?: {
    speed: number;
    unit: 'kmh' | 'mph';
    timestamp: string;
  };
  lastDistance?: {
    distance: number;
    unit: 'km' | 'miles';
    timestamp: string;
  };
  lastMusic?: {
    title: string;
    artist: string;
    album?: string;
    coverUrl?: string;
    service?: 'spotify' | 'apple' | 'manual';
    timestamp: string;
  };
}

export const activitySummaryKeys = {
  all: ['activity-summary'] as const,
  lists: () => [...activitySummaryKeys.all, 'list'] as const,
  list: (eventSlug: string) =>
    [...activitySummaryKeys.lists(), eventSlug] as const,
};

async function fetchActivitySummary(
  eventSlug: string
): Promise<UserActivitySummary[]> {
  const response = await fetch(`/api/events/${eventSlug}/activity-summary`);
  if (!response.ok) {
    throw new Error('Failed to fetch activity summary');
  }
  const result = await response.json();
  return result.data;
}

export function useActivitySummaryRealtimeQuery(
  eventId: string,
  eventSlug: string
) {
  const query = useQuery({
    queryKey: activitySummaryKeys.list(eventSlug),
    queryFn: () => fetchActivitySummary(eventSlug),
    enabled: !!eventSlug,
  });

  // Subscribe to real-time activity updates
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`room-activity-summary-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // Invalidate the query to refetch summaries
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, query]);

  return query;
}
