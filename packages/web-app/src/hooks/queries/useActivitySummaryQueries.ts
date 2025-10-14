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
  list: (roomSlug: string) =>
    [...activitySummaryKeys.lists(), roomSlug] as const,
};

async function fetchActivitySummary(
  roomSlug: string
): Promise<UserActivitySummary[]> {
  const response = await fetch(`/api/rooms/${roomSlug}/activity-summary`);
  if (!response.ok) {
    throw new Error('Failed to fetch activity summary');
  }
  const result = await response.json();
  return result.data;
}

export function useActivitySummaryRealtimeQuery(
  roomId: string,
  roomSlug: string
) {
  const query = useQuery({
    queryKey: activitySummaryKeys.list(roomSlug),
    queryFn: () => fetchActivitySummary(roomSlug),
    enabled: !!roomSlug,
  });

  // Subscribe to real-time activity updates
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-activity-summary-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
          filter: `room_id=eq.${roomId}`,
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
  }, [roomId, query]);

  return query;
}
