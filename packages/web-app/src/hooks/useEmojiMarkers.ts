'use client';

import { useMemo } from 'react';
import { useMessages } from './useMessages';
import { useUser } from './useUser';
import { TrackingActivity, UserActivity } from '@/types/activity';

export interface EmojiMarker {
  id: string;
  emoji: string;
  userName: string;
  location: { lat: number; long: number };
  timestamp: string;
  distance?: number;
}

// Helper to check if a string is a single emoji
const isEmoji = (str: string): boolean => {
  const emojiRegex =
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Extended_Pictographic})$/u;
  return emojiRegex.test(str.trim());
};

export function useEmojiMarkers(
  eventId: string,
  eventSlug: string,
  userNames: Map<string, string>,
  activities: UserActivity[]
) {
  const { user } = useUser();
  const { messages, isLoading, error } = useMessages(eventId, eventSlug);

  // Get current user's distance from latest tracking activity
  const currentUserDistance = useMemo(() => {
    if (!user) return 0;

    // Find the user's most recent tracking activity
    const userActivities = activities
      .filter(a => a.user_id === user.id && a.activity_type === 'tracking')
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );

    if (userActivities.length === 0) return 0;

    const latestActivity = userActivities[0];
    const trackingData = latestActivity.data as TrackingActivity;
    return trackingData?.distance || 0;
  }, [activities, user]);

  const emojiMarkers = useMemo(() => {
    const markers: EmojiMarker[] = [];

    for (const message of messages) {
      // Check if message has content
      if (!message.content) continue;

      // Check if message is a single emoji
      if (!isEmoji(message.content)) continue;

      // Check if the message has a location (stored when sent)
      if (!message.location) continue;

      // Type guard for location
      const location = message.location as {
        lat: number;
        long: number;
        distance?: number;
      };
      if (
        typeof location.lat !== 'number' ||
        typeof location.long !== 'number'
      ) {
        continue;
      }

      const userId = message.user_id;
      const userName =
        userNames.get(userId) || `User ${userId.substring(0, 8)}`;

      markers.push({
        id: message.id,
        emoji: message.content,
        userName,
        location: { lat: location.lat, long: location.long },
        timestamp: message.created_at,
        distance: location.distance,
      });
    }

    return markers;
  }, [messages, userNames]);

  return {
    emojiMarkers,
    currentUserDistance,
    isLoading,
    error,
  };
}
