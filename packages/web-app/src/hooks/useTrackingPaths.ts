'use client';

import {
  useTrackingPathsRealtimeQuery,
  type TrackingPath,
} from './queries/useTrackingPathsQueries';

export type { TrackingPath };

export function useTrackingPaths(eventId: string, eventSlug: string) {
  const { data, isLoading, error } = useTrackingPathsRealtimeQuery(
    eventId,
    eventSlug
  );

  return {
    paths: data ?? [],
    isLoading,
    error,
  };
}
