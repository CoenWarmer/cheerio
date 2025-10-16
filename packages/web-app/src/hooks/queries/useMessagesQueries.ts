'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api/messages-api';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (eventSlug: string) => [...messageKeys.lists(), eventSlug] as const,
};

export function useMessagesQuery(eventSlug: string) {
  return useQuery({
    queryKey: messageKeys.list(eventSlug),
    queryFn: () => messagesApi.getByEventId(eventSlug),
    enabled: !!eventSlug,
  });
}

export function useMessagesRealtimeQuery(eventId: string, eventSlug: string) {
  const queryClient = useQueryClient();

  const query = useMessagesQuery(eventSlug);

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`messages-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: messageKeys.list(eventSlug),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, eventSlug, queryClient]);

  return query;
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      messageData,
    }: {
      eventId: string;
      messageData: {
        content: string;
        attachment?: {
          type: string;
          url: string;
          filename: string;
          mimeType: string;
          size: number;
        };
        location?: { lat: number; long: number };
        user_id?: string;
      };
    }) => messagesApi.create(eventId, messageData),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(eventId) });
    },
  });
}
