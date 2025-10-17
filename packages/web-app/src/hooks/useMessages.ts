'use client';

import { useMemo } from 'react';
import {
  useMessagesRealtimeQuery,
  useSendMessageMutation,
} from './queries/useMessagesQueries';
import type { Message } from '@/types/types';

export type MessageAttachment = {
  type: string;
  url?: string;
  data?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
};

export type EnrichedMessage = Omit<Message, 'attachment'> & {
  userName?: string;
  user_name?: string | null;
  attachment?: MessageAttachment | null;
};

export function useMessages(eventId: string, eventSlug: string) {
  const { data, isLoading, error } = useMessagesRealtimeQuery(
    eventId,
    eventSlug
  );

  // Messages are already enriched with user_name from the API
  const enrichedMessages = useMemo<EnrichedMessage[]>(() => {
    const messages = data?.data ?? [];
    return messages.map(msg => ({
      ...msg,
      userName:
        (msg as Message & { user_name?: string }).user_name ?? undefined,
      attachment: msg.attachment as MessageAttachment | null,
    }));
  }, [data]);

  return {
    messages: enrichedMessages,
    isLoading,
    error,
  };
}

export function useSendMessage() {
  const mutation = useSendMessageMutation();

  return {
    sendMessage: mutation.mutate,
    sendMessageAsync: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error,
  };
}
