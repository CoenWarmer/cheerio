'use client';

import { useMemo } from 'react';
import {
  useRoomMembersQuery,
  type RoomMemberWithProfile,
} from './queries/useRoomMembersQueries';

export type { RoomMemberWithProfile };

export function useRoomMembers(roomSlug: string) {
  const { data, isLoading, error } = useRoomMembersQuery(roomSlug);

  const members = useMemo(() => data ?? [], [data]);

  // Filter members who can track (tracker or admin)
  const trackingMembers = useMemo(() => {
    return members.filter(
      member =>
        member.permissions === 'tracker' || member.permissions === 'admin'
    );
  }, [members]);

  return {
    members,
    trackingMembers,
    isLoading,
    error,
  };
}
