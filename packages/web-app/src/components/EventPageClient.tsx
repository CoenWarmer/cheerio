'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Center, Stack, Title, Text, Anchor } from '@mantine/core';
import ChatSidebar from '@/components/ChatSidebar';
import ActivityTracker from '@/components/ActivityTracker';
import dynamic from 'next/dynamic';
import { useEvent, useJoinEvent } from '@/hooks/useEvents';
import { useActivity } from '@/hooks/useActivity';
import { useEmojiMarkers } from '@/hooks/useEmojiMarkers';
import { useUser } from '@/hooks/useUser';
import { useTrackingPaths } from '@/hooks/useTrackingPaths';
import { AppHeader } from './AppHeader';

// Dynamically import the map component to avoid SSR issues
const EventMap = dynamic(() => import('@/components/EventMap'), {
  ssr: false,
  loading: () => (
    <Center w="100%" h="100%" bg="gray.1">
      <Text c="gray.6">Loading map...</Text>
    </Center>
  ),
});

export default function EventPageClient({ eventSlug }: { eventSlug: string }) {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();

  const { event, isLoading, error: eventError } = useEvent(eventSlug);
  const { joinEvent } = useJoinEvent();

  const { activities, userNames, userLocations } = useActivity(
    event?.id ?? '',
    event?.slug ?? ''
  );

  const { emojiMarkers, currentUserDistance } = useEmojiMarkers(
    event?.id ?? '',
    event?.slug ?? '',
    userNames,
    activities
  );

  const { paths: trackingPaths } = useTrackingPaths(
    event?.id ?? '',
    event?.slug ?? ''
  );

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Redirect to sign-in if no user
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, userLoading, router]);

  // Automatically join the event when visiting
  useEffect(() => {
    if (user && eventSlug) {
      try {
        joinEvent(eventSlug);
      } catch (joinErr) {
        console.warn('Failed to join event automatically:', joinErr);
      }
    }
  }, [eventSlug, user, joinEvent]);

  if (isLoading) {
    return (
      <Center h="100vh" bg="gray.0">
        <Stack align="center" gap="md">
          <Text fz={32}>⏳</Text>
          <Text c="gray.6">Loading event...</Text>
        </Stack>
      </Center>
    );
  }

  if (eventError || !event) {
    return (
      <Center h="100vh" bg="gray.0">
        <Stack align="center" gap="xl">
          <Title order={1}>Event not found</Title>
          <Text c="gray.6" ta="center" maw={500}>
            {eventError?.message ||
              'The event you are looking for does not exist'}
          </Text>
          <Anchor
            component={Link}
            href="/events"
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
            ← Back to Events
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
        <AppHeader
          pageTitle={event.name}
          showCheerButton
          showChatButton
          eventSlug={event.slug}
          eventId={event.id}
          isChatCollapsed={isSidebarCollapsed}
          onChatToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          selectedUserId={selectedUserId}
          onUserSelect={setSelectedUserId}
        />

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
              <EventMap
                eventName={event.name}
                location={event.location}
                userLocations={userLocations}
                emojiMarkers={emojiMarkers}
                trackingPaths={trackingPaths}
                selectedUserId={selectedUserId}
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
                    {user && event && (
                      <ActivityTracker eventSlug={event.slug} />
                    )}
                  </Box>
                  <Box style={{ flex: '1 1 300px', pointerEvents: 'auto' }}>
                    {/* {event && (
                      <UserActivityFeed eventId={event.id} eventSlug={event.slug} />
                    )} */}
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
              {user && event && (
                <ChatSidebar
                  eventId={event.id}
                  eventSlug={event.slug}
                  currentUser={user}
                  currentUserLocation={
                    userLocations.find(loc => loc.userId === user.id)
                      ?.location || null
                  }
                  currentUserDistance={currentUserDistance}
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
