'use client';

import { useMemo } from 'react';
import { useMessages } from './useMessages';

export interface ImageMarker {
  id: string;
  imageUrl: string;
  userName: string;
  location: { lat: number; long: number };
  timestamp: string;
}

export function useImageMarkers(eventId: string, eventSlug: string) {
  const { messages, isLoading, error } = useMessages(eventId, eventSlug);

  const imageMarkers = useMemo(() => {
    const markers: ImageMarker[] = [];

    for (const message of messages) {
      // Check if message has an image attachment
      if (!message.attachment) continue;
      if (message.attachment.type !== 'image') continue;
      if (!message.attachment.url) continue; // Ensure URL exists

      // Check if the message has a location
      if (!message.location) continue;

      // Type guard for location
      const location = message.location as {
        lat: number;
        long: number;
      };
      if (
        typeof location.lat !== 'number' ||
        typeof location.long !== 'number'
      ) {
        continue;
      }

      markers.push({
        id: message.id,
        imageUrl: message.attachment.url,
        userName: message.userName ?? 'Unknown User',
        location: { lat: location.lat, long: location.long },
        timestamp: message.created_at,
      });
    }

    return markers;
  }, [messages]);

  return {
    imageMarkers,
    isLoading,
    error,
  };
}
