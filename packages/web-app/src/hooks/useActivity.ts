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
  eventId: string,
  eventSlug: string,
  filters?: ActivityFilters
) {
  const { data, isLoading, error } = useActivitiesRealtimeQuery(
    eventId,
    eventSlug,
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

  // Process activities into user location markers (for 'location' or 'tracking' types)
  const userLocations = useMemo(() => {
    if (activities.length === 0) {
      return [];
    }

    const locationsByUser = new Map<string, UserLocationMarker>();

    activities.forEach(activity => {
      const userId = activity.user_id;
      const existing = locationsByUser.get(userId);

      // Handle both 'location' and 'tracking' activity types
      let location: LocationActivity | null = null;

      if (activity.activity_type === 'location') {
        location = activity.data as unknown as LocationActivity;
      } else if (activity.activity_type === 'tracking') {
        // Extract location from consolidated tracking data
        // Tracking data has lat/long directly in the data object
        const trackingData = activity.data as unknown as {
          lat?: number;
          long?: number;
          location?: LocationActivity;
        };

        // Check if lat/long are directly in the data (iOS format)
        if (trackingData.lat && trackingData.long) {
          location = {
            lat: trackingData.lat,
            long: trackingData.long,
          };
        } else if (trackingData && trackingData.location) {
          // Or nested in location field (alternative format)
          location = trackingData.location;
        }
      }

      if (!location) return; // Skip if no location data

      if (
        !existing ||
        new Date(activity.created_at!) > new Date(existing.timestamp)
      ) {
        locationsByUser.set(userId, {
          userId,
          userName: userNames.get(userId),
          avatarUrl: userAvatars.get(userId),
          location,
          timestamp: activity.created_at || new Date().toISOString(),
        });
      }
    });

    return Array.from(locationsByUser.values());
  }, [activities, userNames, userAvatars]);

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
