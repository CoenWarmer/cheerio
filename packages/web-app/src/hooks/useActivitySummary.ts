'use client';

import {
  useActivitySummaryRealtimeQuery,
  type UserActivitySummary,
} from './queries/useActivitySummaryQueries';

export type { UserActivitySummary };

export function useActivitySummary(eventId: string, eventSlug: string) {
  const { data, isLoading, error } = useActivitySummaryRealtimeQuery(
    eventId,
    eventSlug
  );

  return {
    summaries: data ?? [],
    isLoading,
    error,
  };
}
