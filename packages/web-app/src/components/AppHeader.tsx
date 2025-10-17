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
  Popover,
  Stack,
  Badge,
  Select,
  Avatar,
  CloseButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { SpeakerphoneIcon } from './icons/SpeakerphoneIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { ChatIcon } from './icons/ChatIcon';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useState, useMemo, useRef, useEffect } from 'react';
import { usePresence } from '@/hooks/usePresence';
import { useEventMembers } from '@/hooks/useEventMembers';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { useHeader } from '@/providers/HeaderProvider';
import { useEvent } from '@/hooks/useEvents';
import { Countdown } from './Countdown';
import { useAuth } from '@/hooks/useAuth';
import styles from './appHeader.module.css';

interface AppHeaderProps {
  /** Current page title (e.g., event name, "Dashboard", "Profile") */
  pageTitle?: string;
  /** Show the cheer button (event page only) */
  showCheerButton?: boolean;
  /** Show the chat toggle button (event page only) */
  showChatButton?: boolean;
  /** Show the navigation links  */
  showNavigationLinks?: boolean;
  /** Event slug for audio recording */
  eventSlug?: string;
  /** Event id for active users */
  eventId?: string;
  /** Chat sidebar collapsed state */
  isChatCollapsed?: boolean;
  /** Show the logo text (navbar only) */
  showLogoText?: boolean;
  /** Callback for chat toggle */
  onChatToggle?: () => void;
  /** Selected user ID for tracking (optional) */
  selectedUserId?: string | null;
  /** Callback when user is selected */
  onUserSelect?: (userId: string | null) => void;
}

export function AppHeader(props?: AppHeaderProps) {
  const t = useTranslations('header');
  const tNav = useTranslations('navigation');
  const { config, setHeaderHeight } = useHeader();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const headerRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();

  // Merge props with context config (props take precedence for direct usage)
  const {
    pageTitle = config.pageTitle,
    showCheerButton = config.showCheerButton ?? false,
    showChatButton = config.showChatButton ?? false,
    eventSlug = config.eventSlug,
    eventId = config.eventId,
    isChatCollapsed = config.isChatCollapsed,
    onChatToggle = config.onChatToggle,
    selectedUserId = config.selectedUserId,
    onUserSelect = config.onUserSelect,
    showNavigationLinks = config.showNavigationLinks,
    showLogoText = config.showLogoText,
  } = props || {};

  const { count: activeUsers } = usePresence(eventId || '', eventSlug || '');
  const { trackingMembers } = useEventMembers(eventSlug || '');

  const { event } = useEvent(eventSlug || '');

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
      label: member.display_name || t('unknownUser'),
    }));
  }, [trackingMembers, t]);

  // Find the selected user
  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return trackingMembers.find(member => member.user_id === selectedUserId);
  }, [selectedUserId, trackingMembers]);

  // Show user selector if there are multiple tracking members
  const showUserSelector =
    trackingMembers.length >= 1 && onUserSelect !== undefined;

  // Measure header height and update context
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    // Initial measurement
    updateHeaderHeight();

    // Update on resize
    window.addEventListener('resize', updateHeaderHeight);

    // Use ResizeObserver for more accurate tracking
    let resizeObserver: ResizeObserver | null = null;
    if (headerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateHeaderHeight);
      resizeObserver.observe(headerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [setHeaderHeight]);

  return (
    <Box
      ref={headerRef}
      component="header"
      className={styles.header}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        flexShrink: 0,
      }}
    >
      <Container
        size="fluid"
        px={isMobile ? 'md' : 'lg'}
        py={isMobile ? 'sm' : 'md'}
      >
        <Group
          justify="space-between"
          align="center"
          wrap="nowrap"
          gap={isMobile ? '0' : 'md'}
          style={{
            flexGrow: 1,
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          {/* Left: Brand/Logo and Page Title */}
          <Group
            gap="sm"
            style={{
              flexGrow: isMobile ? 1 : 0,
              flexDirection: 'row',
              width: isMobile ? '100%' : 'auto',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
              justifyContent: 'space-between',
              marginBottom:
                (isMobile && showNavigationLinks) || showCheerButton ? 16 : 0,
            }}
          >
            <Box style={{ display: 'flex', gap: 8 }}>
              <Logo size="lg" mode="navbar" showText={showLogoText} />
              {pageTitle && (
                <>
                  <Text c="gray.4" fw={300} size="lg">
                    /
                  </Text>
                </>
              )}
            </Box>

            {pageTitle && (
              <Box
                style={{
                  flexGrow: isMobile ? 1 : 0,
                  flexDirection: 'row',
                  width: isMobile ? '100%' : 'auto',
                  flexWrap: isMobile ? 'nowrap' : 'wrap',
                }}
              >
                <Title order={3} size="h4" c="gray.9">
                  {pageTitle}
                </Title>
              </Box>
            )}

            <Box hiddenFrom="sm">
              <LanguageSwitcher />
            </Box>
          </Group>

          {/* Center: Cheer Button & User Selector */}
          {(showCheerButton || showUserSelector) && eventSlug && (
            <Group justify="center" gap="md" style={{ flex: 1 }}>
              {event &&
              event.start_time &&
              new Date(event.start_time) > new Date() ? (
                <Countdown targetDate={new Date(event.start_time)} />
              ) : (
                <>
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
                              aria-label={t('deselectUser')}
                            />
                          }
                          style={{
                            paddingLeft: '6px',
                            paddingRight: '4px',
                            height: '36px',
                          }}
                        >
                          {selectedUser.display_name || t('unknownUser')}
                        </Badge>
                      ) : (
                        <Select
                          placeholder={t('selectAthlete')}
                          value={selectedUserId}
                          onChange={onUserSelect}
                          data={userSelectData}
                          clearable
                          w={180}
                          size="sm"
                        />
                      )}
                    </>
                  )}

                  {/* Cheer Button */}
                  {showCheerButton && (
                    <Popover
                      width={isMobile ? '100%' : 500}
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
                          size={isMobile ? 'sm' : 'md'}
                          pr={14}
                          h={48}
                          onClick={() => setCheerPopoverOpened(o => !o)}
                        >
                          {t('cheerButton')}
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
                              {t.rich('cheerTitle', {
                                athlete: chunks => (
                                  <Text
                                    component="span"
                                    fw={700}
                                    style={{
                                      backgroundColor: '#E7F5FF',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    {chunks}
                                  </Text>
                                ),
                              })}
                            </Title>
                            <Text
                              size="md"
                              c="dimmed"
                              style={{ lineHeight: 1.6 }}
                            >
                              {t('cheerDescription')}
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
                              {isCheerRecording
                                ? t('stopRecording')
                                : t('startRecording')}
                            </Button>
                          </Group>
                        </Stack>
                      </Popover.Dropdown>
                    </Popover>
                  )}
                </>
              )}
            </Group>
          )}

          {/* Right: Navigation Links */}
          <Group gap="md" style={{ flexGrow: 0, justifyContent: 'flex-end' }}>
            {showChatButton && onChatToggle ? (
              <>
                {isChatCollapsed && (
                  <Button
                    variant={isChatCollapsed ? 'filled' : 'light'}
                    leftSection={
                      <>
                        {isChatCollapsed && (
                          <Badge color="green" variant="dot" size="sm" mr="xs">
                            {t('active', { count: activeUsers })}
                          </Badge>
                        )}
                        <ChatIcon size={20} />
                      </>
                    }
                    radius="xl"
                    size="sm"
                    pr={14}
                    pl={4}
                    h={30}
                    onClick={onChatToggle}
                    style={{
                      position: isMobile ? 'absolute' : 'initial',
                      top: (headerRef.current?.offsetHeight || 0) + 10,
                      right: 10,
                      zIndex: 1,
                    }}
                  >
                    {tNav('chat')}
                  </Button>
                )}
              </>
            ) : showNavigationLinks ? (
              <>
                <Anchor
                  component={Link}
                  href="/events"
                  c="gray.6"
                  size="sm"
                  style={{ textDecoration: 'none' }}
                >
                  {tNav('events')}
                </Anchor>

                <Anchor
                  component={Link}
                  href="/profile"
                  c="gray.6"
                  size="sm"
                  style={{ textDecoration: 'none' }}
                >
                  {tNav('profile')}
                </Anchor>

                <Anchor
                  component={Link}
                  href="/new"
                  c="gray.6"
                  size="sm"
                  style={{ textDecoration: 'none' }}
                >
                  {tNav('new')}
                </Anchor>

                <Button variant="subtle" onClick={signOut}>
                  Logout
                </Button>
              </>
            ) : null}

            <Box visibleFrom="sm">
              <LanguageSwitcher />
            </Box>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
