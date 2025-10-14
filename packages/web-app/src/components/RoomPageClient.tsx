'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Center,
  Stack,
  Title,
  Text,
  Anchor,
  Group,
  Button,
  Burger,
  Container,
  Popover,
  List,
  ThemeIcon,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import ChatSidebar from '@/components/ChatSidebar';
import ActivityTracker from '@/components/ActivityTracker';
import UserActivityFeed from '@/components/UserActivityFeed';
import dynamic from 'next/dynamic';
import { useRoom, useJoinRoom } from '@/hooks/useRooms';
import { useActivity } from '@/hooks/useActivity';
import { useEmojiMarkers } from '@/hooks/useEmojiMarkers';
import { useUser } from '@/hooks/useUser';
import { useTrackingPaths } from '@/hooks/useTrackingPaths';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { SpeakerphoneIcon } from './icons/SpeakerphoneIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { ChatIcon } from './icons/ChatIcon';

// Dynamically import the map component to avoid SSR issues
const RoomMap = dynamic(() => import('@/components/RoomMap'), {
  ssr: false,
  loading: () => (
    <Center w="100%" h="100%" bg="gray.1">
      <Text c="gray.6">Loading map...</Text>
    </Center>
  ),
});

export default function RoomPageClient({ roomSlug }: { roomSlug: string }) {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();

  const { room, isLoading, error: roomError } = useRoom(roomSlug);
  const { joinRoom } = useJoinRoom();

  const { userNames, userLocations } = useActivity(
    room?.id ?? '',
    room?.slug ?? '',
    {
      activity_type: 'location',
      limit: 200,
    }
  );

  const { emojiMarkers } = useEmojiMarkers(
    room?.id ?? '',
    room?.slug ?? '',
    userNames
  );

  const { paths: trackingPaths } = useTrackingPaths(
    room?.id ?? '',
    room?.slug ?? ''
  );

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [cheerPopoverOpened, setCheerPopoverOpened] = useState(false);

  // Audio recording hook for cheer popover
  const {
    isRecording: isCheerRecording,
    isSending: isCheerSending,
    toggleRecording: toggleCheerRecording,
  } = useAudioRecorder({
    roomSlug,
    onRecordingComplete: () => {
      setCheerPopoverOpened(false);
    },
  });

  // Redirect to sign-in if no user
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, userLoading, router]);

  // Automatically join the room when visiting
  useEffect(() => {
    if (user && roomSlug) {
      try {
        joinRoom(roomSlug);
      } catch (joinErr) {
        console.warn('Failed to join room automatically:', joinErr);
      }
    }
  }, [roomSlug, user, joinRoom]);

  if (isLoading) {
    return (
      <Center h="100vh" bg="gray.0">
        <Stack align="center" gap="md">
          <Text fz={32}>⏳</Text>
          <Text c="gray.6">Loading room...</Text>
        </Stack>
      </Center>
    );
  }

  if (roomError || !room) {
    return (
      <Center h="100vh" bg="gray.0">
        <Stack align="center" gap="xl">
          <Title order={1}>Room not found</Title>
          <Text c="gray.6" ta="center" maw={500}>
            {roomError?.message ||
              'The room you are looking for does not exist'}
          </Text>
          <Anchor
            component={Link}
            href="/rooms"
            px="xl"
            py="md"
            bg="blue.6"
            c="white"
            style={{
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            ← Back to Rooms
          </Anchor>
        </Stack>
      </Center>
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .chat-sidebar.collapsed {
          right: -400px !important;
        }
        
        .map-overlay-bottom.sidebar-collapsed {
          right: 20px !important;
        }
        
        @media (max-width: 768px) {
          .chat-sidebar {
            top: auto !important;
            right: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 50vh !important;
            border-left: none !important;
            border-top: 1px solid #e5e7eb !important;
          }
          
          .chat-sidebar.collapsed {
            right: 0 !important;
            bottom: -50vh !important;
          }
          
          .map-overlay-bottom {
            right: 20px !important;
            bottom: calc(50vh + 20px) !important;
          }
          
          .map-overlay-bottom.sidebar-collapsed {
            bottom: 20px !important;
          }
        }
      `,
        }}
      />
      <Box
        style={{
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: '#f9fafb',
        }}
      >
        {/* Header */}
        <Box
          component="header"
          style={{
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
            flexShrink: 0,
          }}
        >
          <Container size="fluid" px="lg" py="md" style={{ maxWidth: '100%' }}>
            <Group justify="space-between" align="center">
              {/* Left: Brand/Logo and Room Name */}
              <Group gap="md">
                <Anchor
                  component={Link}
                  href="/rooms"
                  c="gray.7"
                  fw={700}
                  size="lg"
                  style={{ textDecoration: 'none' }}
                >
                  Cheerio <SpeakerphoneIcon fill="#228be6" />
                </Anchor>
                <Text c="gray.4" fw={300} size="lg">
                  /
                </Text>
                <Title order={3} size="h4" c="gray.9">
                  {room.name}
                </Title>

                <Popover
                  width={500}
                  position="bottom"
                  withArrow
                  shadow="xl"
                  opened={cheerPopoverOpened}
                  onChange={setCheerPopoverOpened}
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
                          hoort het direct.
                        </Text>
                      </Box>

                      <List
                        spacing="md"
                        size="sm"
                        center
                        icon={
                          <ThemeIcon color="blue" size={20} radius="xl">
                            <IconCheck size={12} />
                          </ThemeIcon>
                        }
                      >
                        <List.Item>
                          <Text size="sm">
                            <strong>Direct hoorbaar</strong> – je boodschap
                            wordt meteen afgespeeld bij de atleet
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size="sm">
                            <strong>Eenvoudig opnemen</strong> – één klik en je
                            bent klaar om te spreken
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size="sm">
                            <strong>Extra motivatie</strong> – geef die extra
                            push op het juiste moment
                          </Text>
                        </List.Item>
                      </List>

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
              </Group>

              {/* Right: Navigation Links */}
              <Group gap="md" visibleFrom="sm">
                <Button
                  variant="light"
                  leftSection={<ChatIcon size={20} />}
                  radius="xl"
                  size="s"
                  pr={14}
                  pl={4}
                  h={30}
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                >
                  Chat
                </Button>
                <Anchor
                  component={Link}
                  href="/rooms"
                  c="gray.6"
                  size="sm"
                  style={{ textDecoration: 'none' }}
                >
                  Events
                </Anchor>
                <Anchor
                  component={Link}
                  href="/dashboard"
                  c="gray.6"
                  size="sm"
                  style={{ textDecoration: 'none' }}
                >
                  Dashboard
                </Anchor>
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

        {/* Main Content */}
        <Box
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            component="main"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 0,
            }}
          >
            <Box style={{ flex: 1, position: 'relative' }}>
              <RoomMap
                roomName={room.name}
                location={room.location}
                userLocations={userLocations}
                emojiMarkers={emojiMarkers}
                trackingPaths={trackingPaths}
              />

              <Box
                className={`map-overlay-bottom ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  right: '420px',
                  pointerEvents: 'none',
                  zIndex: 500,
                  transition: 'right 0.3s ease, bottom 0.3s ease',
                }}
              >
                <Box style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <Box style={{ flex: '1 1 300px', pointerEvents: 'auto' }}>
                    {user && room && <ActivityTracker roomSlug={room.slug} />}
                  </Box>
                  <Box style={{ flex: '1 1 300px', pointerEvents: 'auto' }}>
                    {room && (
                      <UserActivityFeed roomId={room.id} roomSlug={room.slug} />
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Chat Sidebar Container */}
          <Box
            className={`chat-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '400px',
              zIndex: 1000,
              transition: 'right 0.3s ease, bottom 0.3s ease',
            }}
          >
            {/* Chat Sidebar */}
            <Box
              component="aside"
              style={{
                width: '100%',
                height: '100%',
                borderLeft: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.8)',
                overflow: 'hidden',
              }}
            >
              {user && room && (
                <ChatSidebar
                  roomId={room.id}
                  roomSlug={room.slug}
                  currentUser={user}
                  currentUserLocation={
                    userLocations.find(loc => loc.userId === user.id)
                      ?.location || null
                  }
                  onToggleSidebar={() =>
                    setIsSidebarCollapsed(!isSidebarCollapsed)
                  }
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
