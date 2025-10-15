'use client';

import { useQuery } from '@tanstack/react-query';
import { roomMembersApi, type RoomMemberWithProfile } from '@/lib/api-client';

export const roomMembersKeys = {
  all: ['room-members'] as const,
  lists: () => [...roomMembersKeys.all, 'list'] as const,
  list: (roomSlug: string) => [...roomMembersKeys.lists(), roomSlug] as const,
};

export function useRoomMembersQuery(roomSlug: string) {
  return useQuery({
    queryKey: roomMembersKeys.list(roomSlug),
    queryFn: async () => {
      const result = await roomMembersApi.getByRoomSlug(roomSlug);
      return result.data;
    },
    enabled: !!roomSlug,
  });
}

export type { RoomMemberWithProfile };

