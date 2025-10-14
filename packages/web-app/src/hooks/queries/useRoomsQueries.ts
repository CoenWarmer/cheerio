'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '@/lib/api-client';

export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...roomKeys.lists(), filters] as const,
  details: () => [...roomKeys.all, 'detail'] as const,
  detail: (id: string) => [...roomKeys.details(), id] as const,
};

export function useRoomsQuery() {
  return useQuery({
    queryKey: roomKeys.lists(),
    queryFn: () => roomsApi.getAll(),
  });
}

export function useRoomQuery(roomSlug: string) {
  return useQuery({
    queryKey: roomKeys.detail(roomSlug),
    queryFn: () => roomsApi.getById(roomSlug),
    enabled: !!roomSlug,
  });
}

export function useCreateRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: roomsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    },
  });
}

export function useJoinRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.join(roomId),
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
    },
  });
}
