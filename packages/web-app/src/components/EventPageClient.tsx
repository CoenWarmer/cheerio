'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Center, Stack, Title, Text, Anchor } from '@mantine/core';
import { useTranslations, useLocale } from 'next-intl';
import ChatSidebar from '@/components/ChatSidebar';
import ActivityTracker from '@/components/ActivityTracker';
import dynamic from 'next/dynamic';
import { useEvent, useJoinEvent } from '@/hooks/useEvents';
import { useActivity } from '@/hooks/useActivity';
import { useEmojiMarkers } from '@/hooks/useEmojiMarkers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTrackingPaths } from '@/hooks/useTrackingPaths';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useHeader } from '@/providers/HeaderProvider';
import { useMediaQuery } from '@mantine/hooks';

// Loading component for the map
function MapLoading() {
  const t = useTranslations('eventPage');
  return (
    <Center w="100%" h="100%" bg="gray.1">
      <Text c="gray.6">{t('loadingMap')}</Text>
    </Center>
  );
}

// Dynamically import the map component to avoid SSR issues
const EventMap = dynamic(() => import('@/components/EventMap'), {
  ssr: false,
  loading: () => <MapLoading />,
});

export default function EventPageClient({ eventSlug }: { eventSlug: string }) {
  const router = useRouter();
  const t = useTranslations('eventPage');
  const locale = useLocale();
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  const { headerHeight } = useHeader();

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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const isMobile = useMediaQuery('(max-width: 48em)');

  // Configure the header from this page
  useHeaderConfig({
    pageTitle: event?.name || '',
    showCheerButton: true,
    showChatButton: true,
    eventSlug: event?.slug || '',
    eventId: event?.id || '',
    isChatCollapsed: isSidebarCollapsed,
    onChatToggle: () => setIsSidebarCollapsed(!isSidebarCollapsed),
    selectedUserId,
    showLogoText: !isMobile,
    onUserSelect: setSelectedUserId,
  });

  // Redirect to on-your-marks if not logged in (either authenticated or anonymous)
  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push(`/${locale}/on-your-marks`);
    }
  }, [currentUser, userLoading, router, locale]);

  // Automatically join the event when visiting
  useEffect(() => {
    if (currentUser?.id && eventSlug) {
      try {
        joinEvent({ eventId: eventSlug, userId: currentUser.id });
      } catch (joinErr) {
        console.warn('Failed to join event automatically:', joinErr);
      }
    }
  }, [eventSlug, currentUser?.id, joinEvent]);

  // Show loading while checking authentication
  if (userLoading || !currentUser) {
    return (
      <Box
        style={{
          display: 'flex',
          height: `calc(100vh - ${headerHeight}px)`,
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
        }}
      >
        <Text c="gray.6">Loading...</Text>
      </Box>
    );
  }

  return (
    <>
      <Box
        style={{
          display: 'flex',
          height: `calc(100vh - ${headerHeight}px)`,
          overflow: 'hidden',
          flexDirection: 'column',
          background: '#f9fafb',
          position: 'relative',
        }}
      >
        {/* Main Content */}
        <Box
          style={{
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
            width: '100%',
          }}
        >
          <Box
            component="main"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 0,
            }}
          >
            {isLoading ? (
              <Center h="100vh" bg="gray.0">
                <Stack align="center" gap="md">
                  <Text fz={32}>⏳</Text>
                  <Text c="gray.6">{t('loadingEvent')}</Text>
                </Stack>
              </Center>
            ) : eventError || !event ? (
              <Center h="100vh" bg="gray.0">
                <Stack align="center" gap="xl">
                  <Title order={1}>{t('notFound')}</Title>
                  <Text c="gray.6" ta="center" maw={500}>
                    {eventError?.message || t('notFoundMessage')}
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
                    {t('backToEvents')}
                  </Anchor>
                </Stack>
              </Center>
            ) : (
              <>
                <EventMap
                  eventName={event.name}
                  location={event.location}
                  userLocations={userLocations}
                  emojiMarkers={emojiMarkers}
                  trackingPaths={trackingPaths}
                  selectedUserId={selectedUserId}
                  eventSlug={event.slug}
                />
                <Box>
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '20px',
                      right: isSidebarCollapsed ? '20px' : '420px',
                      pointerEvents: 'none',
                      zIndex: 500,
                      transition: 'right 0.3s ease, bottom 0.3s ease',
                    }}
                  >
                    <Box
                      style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}
                    >
                      <Box style={{ flex: '1 1 300px', pointerEvents: 'auto' }}>
                        {currentUser && event && (
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

                {/* Chat Sidebar Container */}
                <aside
                  style={{
                    position: 'fixed',
                    top: `${headerHeight}px`,
                    right: isSidebarCollapsed ? '-400px' : '0px',
                    bottom: 0,
                    width: '400px',
                    zIndex: 1000,
                    transition: 'right 0.3s ease',
                    borderLeft: '1px solid #e5e7eb',
                    background: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  {/* Chat Sidebar */}
                  <Box
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    {currentUser && event && (
                      <ChatSidebar
                        eventId={event.id}
                        eventSlug={event.slug}
                        currentUser={currentUser}
                        currentUserLocation={
                          userLocations.find(
                            loc => loc.userId === currentUser.id
                          )?.location || null
                        }
                        currentUserDistance={currentUserDistance}
                        onToggleSidebar={() => {
                          console.log('hello?');
                          setIsSidebarCollapsed(!isSidebarCollapsed);
                        }}
                      />
                    )}
                  </Box>
                </aside>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
