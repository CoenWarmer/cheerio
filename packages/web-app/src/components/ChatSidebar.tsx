'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Stack,
  Group,
  Text,
  TextInput,
  Button,
  Badge,
  ActionIcon,
  Center,
  Paper,
} from '@mantine/core';
import { useTranslations, useLocale } from 'next-intl';
import { ApiError } from '@/lib/api-client';
import type { User } from '@supabase/supabase-js';
import { useMessages, useSendMessage } from '@/hooks/useMessages';
import {
  usePresence,
  useUpdatePresence,
  useRemovePresence,
} from '@/hooks/usePresence';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { ChatIcon } from './icons/ChatIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { isEmoji } from '@/utils/emoji';

interface ChatSidebarProps {
  eventId: string; // Event UUID for realtime subscriptions
  eventSlug: string; // Event slug for API calls
  currentUser: User;
  currentUserLocation?: { lat: number; long: number } | null;
  currentUserDistance?: number;
  onToggleSidebar: () => void;
}

// Constants to prevent object recreation
const MESSAGE_BUBBLE_STYLE_CURRENT = {
  wordWrap: 'break-word' as const,
  borderBottomRightRadius: '0.25rem',
};

const MESSAGE_BUBBLE_STYLE_OTHER = {
  wordWrap: 'break-word' as const,
  borderBottomLeftRadius: '0.25rem',
};

const RECORD_BUTTON_STYLE = {
  fontSize: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
};

const PULSE_DOT_STYLE = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'white',
  animation: 'pulse 1.5s infinite',
};

const AUDIO_STYLE = {
  width: '100%',
  maxWidth: '300px',
  height: '32px',
};

const CONTAINER_STYLE = {
  position: 'relative' as const,
  display: 'flex',
  flexDirection: 'column' as const,
};

const HEADER_STYLE = {
  borderBottom: '1px solid #e5e7eb',
  flexShrink: 0,
};

const MESSAGES_WRAPPER_STYLE = {
  flex: 1,
  overflowY: 'auto' as const,
  padding: '1rem',
};

const INPUT_STYLE = {
  borderTop: '1px solid #e5e7eb',
  flexShrink: 0,
};

export default function ChatSidebar({
  eventId,
  eventSlug,
  currentUser,
  currentUserLocation,
  currentUserDistance = 0,
  onToggleSidebar,
}: ChatSidebarProps) {
  const t = useTranslations('chat');
  const locale = useLocale();

  // Use hooks for data fetching
  const { messages: messagesData, isLoading: loading } = useMessages(
    eventId,
    eventSlug
  );
  const { sendMessage } = useSendMessage();
  const { count: activeUsers } = usePresence(eventId, eventSlug);
  const { updatePresence } = useUpdatePresence();
  const { removePresence } = useRemovePresence();

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevMessageCountRef = useRef(0);

  // Audio recording hook
  const {
    isRecording,
    isSending: isRecordingSending,
    toggleRecording,
  } = useAudioRecorder({
    eventSlug,
    onRecordingComplete: () => {
      scrollToBottom();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messagesData.length > prevMessageCountRef.current) {
      // Use setTimeout to ensure DOM has updated before scrolling
      setTimeout(scrollToBottom, 0);
    }
    prevMessageCountRef.current = messagesData.length;
  }, [messagesData.length]);

  // Presence management
  useEffect(() => {
    // Initial presence update
    updatePresence({ eventId: eventSlug, status: 'online' });

    // Update presence every 20 seconds
    presenceIntervalRef.current = setInterval(() => {
      updatePresence({ eventId: eventSlug, status: 'online' });
    }, 20000);

    // Cleanup on unmount
    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      // Remove presence when leaving
      removePresence(eventSlug);
    };
  }, [eventSlug, updatePresence, removePresence]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    setSending(true);

    try {
      const content = newMessage.trim();
      const messageData: {
        content: string;
        location?: { lat: number; long: number; distance?: number };
      } = {
        content,
      };

      // If this is an emoji and the user has a location, include it with distance
      if (isEmoji(content) && currentUserLocation) {
        messageData.location = {
          ...currentUserLocation,
          distance: currentUserDistance,
        };
      }

      sendMessage({ eventId: eventSlug, messageData });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      if (err instanceof ApiError) {
        alert(t('sendMessageErrorDetail', { error: err.message }));
      } else {
        alert(t('sendMessageError'));
      }
    } finally {
      setSending(false);
    }
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }

  return (
    <Box h="100%" style={CONTAINER_STYLE}>
      {/* Chat Header */}
      <Group p="md" justify="space-between" bg="white" style={HEADER_STYLE}>
        <Group gap="10px">
          <Text size="lg" fw={700}>
            {t('title')}
          </Text>
          <ChatIcon fill="#228be6" />
        </Group>
        <Group gap="xs">
          <Text size="xs" c="gray.6">
            {t('messageCount', { count: messagesData.length })}
          </Text>
          <Text c="gray.3">•</Text>
          <Badge color="green" variant="dot" size="sm">
            {t('activeUsers', { count: activeUsers })}
          </Badge>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={onToggleSidebar}
            aria-label={t('closeChat')}
          >
            ✕
          </ActionIcon>
        </Group>
      </Group>

      {/* Messages Area */}
      <Box style={MESSAGES_WRAPPER_STYLE}>
        <Stack gap="md">
          {loading ? (
            <Center h="100%">
              <Text c="gray.6">{t('loadingMessages')}</Text>
            </Center>
          ) : messagesData.length === 0 ? (
            <Center h="100%">
              <Stack align="center" gap="xs">
                <Text fz={32}>💬</Text>
                <Text size="sm" c="gray.6" ta="center">
                  {t('noMessages')}
                </Text>
              </Stack>
            </Center>
          ) : (
            messagesData.map(message => {
              const isCurrentUser = message.user_id === currentUser.id;
              const userName = isCurrentUser
                ? t('you')
                : message.userName || t('unknownUser');

              return (
                <Stack
                  key={message.id}
                  gap="xs"
                  align={isCurrentUser ? 'flex-end' : 'flex-start'}
                >
                  {/* User name label */}
                  {!isCurrentUser && (
                    <Text size="xs" c="gray.6" fw={500} pl="xs">
                      {userName}
                    </Text>
                  )}

                  <Paper
                    p="sm"
                    radius="lg"
                    bg={isCurrentUser ? 'blue.6' : 'white'}
                    c={isCurrentUser ? 'white' : 'dark'}
                    shadow="xs"
                    maw="75%"
                    style={
                      isCurrentUser
                        ? MESSAGE_BUBBLE_STYLE_CURRENT
                        : MESSAGE_BUBBLE_STYLE_OTHER
                    }
                  >
                    {message.content}
                    {message.attachment &&
                      message.attachment.type === 'audio' && (
                        <Box mt="xs">
                          <audio
                            controls
                            src={
                              message.attachment.url || message.attachment.data
                            }
                            style={AUDIO_STYLE}
                          />
                        </Box>
                      )}
                  </Paper>
                  <Text
                    size="xs"
                    c="gray.5"
                    pl={isCurrentUser ? 0 : 'xs'}
                    pr={isCurrentUser ? 'xs' : 0}
                  >
                    {formatTime(message.created_at)}
                    {message.edited_at && ` (${t('edited')})`}
                  </Text>
                </Stack>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </Stack>
      </Box>

      {/* Message Input */}
      <Box p="md" bg="white" style={INPUT_STYLE}>
        <form onSubmit={handleSendMessage}>
          <Group gap="xs" align="flex-end">
            <TextInput
              flex={1}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={t('typeMessage')}
              disabled={sending || isRecording || isRecordingSending}
              radius="xl"
              size="sm"
            />
            <Button
              type="button"
              onClick={toggleRecording}
              disabled={sending || isRecordingSending}
              color={isRecording ? 'red' : 'green'}
              radius="xl"
              size="sm"
              style={RECORD_BUTTON_STYLE}
            >
              {isRecording ? (
                <>
                  <Box style={PULSE_DOT_STYLE} />
                  {t('stop')}
                </>
              ) : (
                <>
                  <MicrophoneIcon />
                </>
              )}
            </Button>
            <Button
              type="submit"
              disabled={
                !newMessage.trim() ||
                sending ||
                isRecording ||
                isRecordingSending
              }
              color="blue"
              radius="xl"
              size="sm"
            >
              {sending ? t('sending') : t('send')}
            </Button>
          </Group>
        </form>
      </Box>
    </Box>
  );
}
