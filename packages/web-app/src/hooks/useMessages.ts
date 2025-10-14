'use client';

import { useMemo } from 'react';
import {
  useMessagesRealtimeQuery,
  useSendMessageMutation,
} from './queries/useMessagesQueries';
import { useProfiles } from './useProfiles';
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
  attachment?: MessageAttachment | null;
};

export function useMessages(roomId: string, roomSlug: string) {
  const { data, isLoading, error } = useMessagesRealtimeQuery(roomId, roomSlug);

  const messages = useMemo(() => data?.data ?? [], [data]);

  // Get unique user IDs from messages
  const uniqueUserIds = useMemo(() => {
    return Array.from(
      new Set(messages.map(msg => msg.user_id).filter(Boolean))
    );
  }, [messages]);

  // Fetch profiles for all users in messages
  const { profiles } = useProfiles(uniqueUserIds);

  // Enrich messages with user names
  const enrichedMessages = useMemo<EnrichedMessage[]>(() => {
    return messages.map(msg => ({
      ...msg,
      userName:
        profiles.find(p => p.id === msg.user_id)?.display_name ?? undefined,
      attachment: msg.attachment as MessageAttachment | null,
    }));
  }, [messages, profiles]);

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
