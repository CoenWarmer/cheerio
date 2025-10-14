'use client';

import { useMemo } from 'react';
import {
  useActivitiesRealtimeQuery,
  useCreateActivityMutation,
} from './queries/useActivityQueries';
import { useProfiles } from './useProfiles';
import type { ActivityFilters, LocationActivity } from '@/types/activity';

export interface UserLocationMarker {
  userId: string;
  userName?: string;
  avatarUrl?: string;
  location: LocationActivity;
  timestamp: string;
}

export function useActivity(
  roomId: string,
  roomSlug: string,
  filters?: ActivityFilters
) {
  const { data, isLoading, error } = useActivitiesRealtimeQuery(
    roomId,
    roomSlug,
    filters
  );

  const activities = useMemo(() => data?.data ?? [], [data]);

  const uniqueUserIds = useMemo(
    () => Array.from(new Set(activities.map(a => a.user_id))),
    [activities]
  );

  const { profiles } = useProfiles(uniqueUserIds);

  // Convert profiles to Maps (combined for efficiency)
  const { userNames, userAvatars } = useMemo(() => {
    const names = new Map<string, string>();
    const avatars = new Map<string, string>();

    profiles.forEach(profile => {
      if (profile.display_name) names.set(profile.id, profile.display_name);
      if (profile.avatar_url) avatars.set(profile.id, profile.avatar_url);
    });

    return { userNames: names, userAvatars: avatars };
  }, [profiles]);

  // Process activities into user location markers (only when filter is 'location')
  const userLocations = useMemo(() => {
    if (activities.length === 0 || filters?.activity_type !== 'location') {
      return [];
    }

    const locationsByUser = new Map<string, UserLocationMarker>();

    activities.forEach(activity => {
      const userId = activity.user_id;
      const existing = locationsByUser.get(userId);

      if (
        !existing ||
        new Date(activity.created_at!) > new Date(existing.timestamp)
      ) {
        locationsByUser.set(userId, {
          userId,
          userName: userNames.get(userId),
          avatarUrl: userAvatars.get(userId),
          location: activity.data as unknown as LocationActivity,
          timestamp: activity.created_at || new Date().toISOString(),
        });
      }
    });

    return Array.from(locationsByUser.values());
  }, [activities, userNames, userAvatars, filters?.activity_type]);

  return {
    activities,
    userNames,
    userAvatars,
    userLocations,
    isLoading,
    error,
  };
}

export function useCreateActivity() {
  const mutation = useCreateActivityMutation();

  return {
    createActivity: mutation.mutate,
    createActivityAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
