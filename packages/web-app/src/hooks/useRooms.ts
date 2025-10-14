'use client';

import {
  useRoomsQuery,
  useRoomQuery,
  useCreateRoomMutation,
  useJoinRoomMutation,
} from './queries/useRoomsQueries';

export function useRooms() {
  const { data, isLoading, error } = useRoomsQuery();

  return {
    rooms: data?.data ?? [],
    isLoading,
    error,
  };
}

export function useRoom(roomSlug: string) {
  const { data, isLoading, error } = useRoomQuery(roomSlug);

  return {
    room: data?.data ?? null,
    isLoading,
    error,
  };
}

export function useCreateRoom() {
  const mutation = useCreateRoomMutation();

  return {
    createRoom: mutation.mutate,
    createRoomAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useJoinRoom() {
  const mutation = useJoinRoomMutation();

  return {
    joinRoom: mutation.mutate,
    joinRoomAsync: mutation.mutateAsync,
    isJoining: mutation.isPending,
    error: mutation.error,
  };
}
