'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api-client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (roomSlug: string) => [...messageKeys.lists(), roomSlug] as const,
};

export function useMessagesQuery(roomSlug: string) {
  return useQuery({
    queryKey: messageKeys.list(roomSlug),
    queryFn: () => messagesApi.getByRoomId(roomSlug),
    enabled: !!roomSlug,
  });
}

export function useMessagesRealtimeQuery(roomId: string, roomSlug: string) {
  const queryClient = useQueryClient();

  const query = useMessagesQuery(roomSlug);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`messages-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: messageKeys.list(roomSlug),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, roomSlug, queryClient]);

  return query;
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      messageData,
    }: {
      roomId: string;
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
      };
    }) => messagesApi.create(roomId, messageData),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(roomId) });
    },
  });
}
