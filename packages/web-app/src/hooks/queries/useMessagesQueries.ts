'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api/messages-api';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/types/types';

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
    // Optimistic update: add message immediately before API call
    onMutate: async ({ eventId, messageData }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: messageKeys.list(eventId) });

      // Snapshot the previous value for rollback
      const previousMessages = queryClient.getQueryData(
        messageKeys.list(eventId)
      );

      // Optimistically update the cache
      queryClient.setQueryData(
        messageKeys.list(eventId),
        (old: { data: Message[] } | undefined) => {
          const optimisticMessage: Message = {
            id: `temp-${Date.now()}`, // Temporary ID
            content: messageData.content,
            attachment: messageData.attachment || null,
            location: messageData.location || null,
            user_id: messageData.user_id || '',
            event_id: eventId,
            created_at: new Date().toISOString(),
            deleted: false,
            edited_at: null,
          };

          return {
            data: [...(old?.data || []), optimisticMessage],
          };
        }
      );

      // Return context with previous value for rollback
      return { previousMessages };
    },
    // If mutation fails, rollback to previous messages
    onError: (err, { eventId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messageKeys.list(eventId),
          context.previousMessages
        );
      }
      console.error('Failed to send message:', err);
    },
    // Always refetch after error or success (realtime will update with real data)
    onSettled: (_, __, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(eventId) });
    },
  });
}
