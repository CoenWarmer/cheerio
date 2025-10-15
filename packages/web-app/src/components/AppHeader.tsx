'use client';

import Link from 'next/link';
import {
  Box,
  Container,
  Group,
  Title,
  Text,
  Anchor,
  Button,
  Burger,
  Popover,
  Stack,
  Badge,
  Select,
  Avatar,
  CloseButton,
} from '@mantine/core';
import { SpeakerphoneIcon } from './icons/SpeakerphoneIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { ChatIcon } from './icons/ChatIcon';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useState, useMemo } from 'react';
import { usePresence } from '@/hooks/usePresence';
import { useEventMembers } from '@/hooks/useEventMembers';
import { Logo } from './Logo';

interface AppHeaderProps {
  /** Current page title (e.g., event name, "Dashboard", "Profile") */
  pageTitle?: string;
  /** Show the cheer button (event page only) */
  showCheerButton?: boolean;
  /** Show the chat toggle button (event page only) */
  showChatButton?: boolean;
  /** Event slug for audio recording */
  eventSlug?: string;
  /** Event id for active users */
  eventId?: string;
  /** Chat sidebar collapsed state */
  isChatCollapsed?: boolean;
  /** Callback for chat toggle */
  onChatToggle?: () => void;
  /** Selected user ID for tracking (optional) */
  selectedUserId?: string | null;
  /** Callback when user is selected */
  onUserSelect?: (userId: string | null) => void;
}

export function AppHeader({
  pageTitle,
  showCheerButton = false,
  showChatButton = false,
  eventSlug,
  eventId,
  isChatCollapsed,
  onChatToggle,
  selectedUserId,
  onUserSelect,
}: AppHeaderProps) {
  const { count: activeUsers } = usePresence(eventId || '', eventSlug || '');
  const { trackingMembers } = useEventMembers(eventSlug || '');

  const [cheerPopoverOpened, setCheerPopoverOpened] = useState(false);

  // Audio recording hook for cheer popover
  const {
    isRecording: isCheerRecording,
    isSending: isCheerSending,
    toggleRecording: toggleCheerRecording,
  } = useAudioRecorder({
    eventSlug: eventSlug || '',
    onRecordingComplete: () => {
      setCheerPopoverOpened(false);
    },
  });

  // Prepare select data for tracking members
  const userSelectData = useMemo(() => {
    return trackingMembers.map(member => ({
      value: member.user_id,
      label: member.display_name || 'Unknown User',
    }));
  }, [trackingMembers]);

  // Find the selected user
  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return trackingMembers.find(member => member.user_id === selectedUserId);
  }, [selectedUserId, trackingMembers]);

  console.log(trackingMembers);

  // Show user selector if there are multiple tracking members
  const showUserSelector =
    trackingMembers.length >= 1 && onUserSelect !== undefined;

  return (
    <Box
      component="header"
      style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        flexShrink: 0,
      }}
    >
      <Container size="fluid" px="lg" py="md" style={{ maxWidth: '100%' }}>
        <Group justify="space-between" align="center" wrap="nowrap">
          {/* Left: Brand/Logo and Page Title */}
          <Group gap="md" style={{ flex: 1 }}>
            <>
              <Logo size="lg" />
              {pageTitle && (
                <>
                  <Text c="gray.4" fw={300} size="lg">
                    /
                  </Text>
                </>
              )}
            </>

            {pageTitle && (
              <Title order={3} size="h4" c="gray.9">
                {pageTitle}
              </Title>
            )}
          </Group>

          {/* Center: Cheer Button & User Selector */}
          {(showCheerButton || showUserSelector) && eventSlug && (
            <Group justify="center" gap="md" style={{ flex: 1 }}>
              {/* User Selector / Selected User Badge */}
              {showUserSelector && (
                <>
                  {selectedUser ? (
                    <Badge
                      size="lg"
                      radius="xl"
                      variant="light"
                      leftSection={
                        <Avatar
                          src={selectedUser.avatar_url}
                          size={24}
                          radius="xl"
                        />
                      }
                      rightSection={
                        <CloseButton
                          size="xs"
                          onClick={() => onUserSelect?.(null)}
                          aria-label="Deselect user"
                        />
                      }
                      style={{
                        paddingLeft: '6px',
                        paddingRight: '4px',
                        height: '36px',
                      }}
                    >
                      {selectedUser.display_name || 'Unknown User'}
                    </Badge>
                  ) : (
                    <Select
                      placeholder="Selecteer sporter"
                      value={selectedUserId}
                      onChange={onUserSelect}
                      data={userSelectData}
                      clearable
                      w={200}
                      size="sm"
                    />
                  )}
                </>
              )}

              {/* Cheer Button */}
              {showCheerButton && (
                <Popover
                  width={500}
                  position="bottom"
                  withArrow
                  shadow="xl"
                  opened={cheerPopoverOpened}
                  onChange={setCheerPopoverOpened}
                  transitionProps={{
                    transition: 'scale-y',
                    duration: 300,
                    timingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <Popover.Target>
                    <Button
                      variant="light"
                      leftSection={<SpeakerphoneIcon />}
                      radius="xl"
                      size="md"
                      pr={14}
                      h={48}
                      onClick={() => setCheerPopoverOpened(o => !o)}
                    >
                      Moedig je atleet aan!
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown p="xl">
                    <Stack gap="xl">
                      <Box>
                        <Title
                          order={2}
                          size="h2"
                          fw={700}
                          mb="md"
                          style={{ lineHeight: 1.2 }}
                        >
                          Moedig je{' '}
                          <Text
                            component="span"
                            fw={700}
                            style={{
                              backgroundColor: '#E7F5FF',
                              padding: '4px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            atleet
                          </Text>{' '}
                          aan! 💪
                        </Title>
                        <Text size="md" c="dimmed" style={{ lineHeight: 1.6 }}>
                          Klik op opnemen en neem een boodschap op. Jouw sporter
                          hoort het direct tijdens de race.
                        </Text>
                      </Box>

                      <Group gap="md">
                        <Button
                          variant={isCheerRecording ? 'filled' : 'filled'}
                          color={isCheerRecording ? 'red' : 'blue'}
                          leftSection={<MicrophoneIcon />}
                          radius="xl"
                          size="md"
                          pr={14}
                          h={48}
                          onClick={toggleCheerRecording}
                          loading={isCheerSending}
                          disabled={isCheerSending}
                        >
                          {isCheerRecording ? 'Stop Opname' : 'Start Opname'}
                        </Button>
                      </Group>
                    </Stack>
                  </Popover.Dropdown>
                </Popover>
              )}
            </Group>
          )}

          {/* Right: Navigation Links */}
          <Group
            gap="md"
            visibleFrom="sm"
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            {showChatButton && onChatToggle ? (
              <div>
                {isChatCollapsed && (
                  <Badge color="green" variant="dot" size="sm" mr="xs">
                    {activeUsers} active
                  </Badge>
                )}
                <Button
                  variant={isChatCollapsed ? 'filled' : 'light'}
                  leftSection={<ChatIcon size={20} />}
                  radius="xl"
                  size="sm"
                  pr={14}
                  pl={4}
                  h={30}
                  onClick={onChatToggle}
                >
                  Chat
                </Button>
              </div>
            ) : (
              <>
                <Anchor
                  component={Link}
                  href="/events"
                  c="gray.6"
                  size="sm"
                  style={{ textDecoration: 'none' }}
                >
                  Events
                </Anchor>
              </>
            )}
            <Button
              component={Link}
              href="/profile"
              variant="default"
              size="sm"
            >
              Profile
            </Button>
          </Group>

          {/* Mobile burger menu */}
          <Burger
            opened={false}
            hiddenFrom="sm"
            size="sm"
            aria-label="Toggle navigation"
          />
        </Group>
      </Container>
    </Box>
  );
}
