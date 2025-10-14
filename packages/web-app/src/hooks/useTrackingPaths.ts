'use client';

import {
  useTrackingPathsRealtimeQuery,
  type TrackingPath,
} from './queries/useTrackingPathsQueries';

export type { TrackingPath };

export function useTrackingPaths(roomId: string, roomSlug: string) {
  const { data, isLoading, error } = useTrackingPathsRealtimeQuery(
    roomId,
    roomSlug
  );

  return {
    paths: data ?? [],
    isLoading,
    error,
  };
}
