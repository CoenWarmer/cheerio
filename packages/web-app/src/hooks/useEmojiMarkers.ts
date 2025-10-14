'use client';

import { useMemo } from 'react';
import { useMessages } from './useMessages';

export interface EmojiMarker {
  id: string;
  emoji: string;
  userName: string;
  location: { lat: number; long: number };
  timestamp: string;
}

// Helper to check if a string is a single emoji
const isEmoji = (str: string): boolean => {
  const emojiRegex =
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Extended_Pictographic})$/u;
  return emojiRegex.test(str.trim());
};

export function useEmojiMarkers(
  roomId: string,
  roomSlug: string,
  userNames: Map<string, string>
) {
  const { messages, isLoading, error } = useMessages(roomId, roomSlug);

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
      const location = message.location as { lat: number; long: number };
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
        location,
        timestamp: message.created_at,
      });
    }

    return markers;
  }, [messages, userNames]);

  return {
    emojiMarkers,
    isLoading,
    error,
  };
}
