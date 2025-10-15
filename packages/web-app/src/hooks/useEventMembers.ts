'use client';

import { useMemo } from 'react';
import {
  useEventMembersQuery,
  type EventMemberWithProfile,
} from './queries/useEventMembersQueries';

export type { EventMemberWithProfile };

export function useEventMembers(eventSlug: string) {
  const { data, isLoading, error } = useEventMembersQuery(eventSlug);

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
