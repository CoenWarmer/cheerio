'use client';

import {
  useActivitySummaryRealtimeQuery,
  type UserActivitySummary,
} from './queries/useActivitySummaryQueries';

export type { UserActivitySummary };

export function useActivitySummary(roomId: string, roomSlug: string) {
  const { data, isLoading, error } = useActivitySummaryRealtimeQuery(
    roomId,
    roomSlug
  );

  return {
    summaries: data ?? [],
    isLoading,
    error,
  };
}
