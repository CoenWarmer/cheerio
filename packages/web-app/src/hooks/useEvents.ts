'use client';

import {
  useEventsQuery,
  useEventQuery,
  useCreateEventMutation,
  useJoinEventMutation,
} from './queries/useEventsQueries';

export function useEvents() {
  const { data, isLoading, error } = useEventsQuery();

  return {
    events: data?.data ?? [],
    isLoading,
    error,
  };
}

export function useEvent(eventSlug: string) {
  const { data, isLoading, error } = useEventQuery(eventSlug);

  return {
    event: data?.data ?? null,
    isLoading,
    error,
  };
}

export function useCreateEvent() {
  const mutation = useCreateEventMutation();

  return {
    createEvent: mutation.mutate,
    createEventAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useJoinEvent() {
  const mutation = useJoinEventMutation();

  return {
    joinEvent: mutation.mutate,
    joinEventAsync: mutation.mutateAsync,
    isJoining: mutation.isPending,
    error: mutation.error,
  };
}
