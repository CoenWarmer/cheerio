'use client';

import { useQuery } from '@tanstack/react-query';
import { eventMembersApi, type EventMemberWithProfile } from '@/lib/api-client';

export const eventMembersKeys = {
  all: ['room-members'] as const,
  lists: () => [...eventMembersKeys.all, 'list'] as const,
  list: (eventSlug: string) => [...eventMembersKeys.lists(), eventSlug] as const,
};

export function useEventMembersQuery(eventSlug: string) {
  return useQuery({
    queryKey: eventMembersKeys.list(eventSlug),
    queryFn: async () => {
      const result = await eventMembersApi.getByEventSlug(eventSlug);
      return result.data;
    },
    enabled: !!eventSlug,
  });
}

export type { EventMemberWithProfile };

