'use client';

import {
  usePresenceRealtimeQuery,
  useUpdatePresenceMutation,
  useRemovePresenceMutation,
} from './queries/usePresenceQueries';

export function usePresence(roomId: string, roomSlug: string) {
  const { data, isLoading, error } = usePresenceRealtimeQuery(roomId, roomSlug);

  return {
    activeUsers: data?.data ?? [],
    count: data?.count ?? 0,
    isLoading,
    error,
  };
}

export function useUpdatePresence() {
  const mutation = useUpdatePresenceMutation();

  return {
    updatePresence: mutation.mutate,
    updatePresenceAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useRemovePresence() {
  const mutation = useRemovePresenceMutation();

  return {
    removePresence: mutation.mutate,
    removePresenceAsync: mutation.mutateAsync,
    isRemoving: mutation.isPending,
    error: mutation.error,
  };
}
