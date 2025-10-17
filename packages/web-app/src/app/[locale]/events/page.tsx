'use client';

import {
  Box,
  Container,
  Title,
  Text,
  Stack,
  Alert,
  Center,
  Card,
} from '@mantine/core';
import { useTranslations, useLocale } from 'next-intl';
import { useEvents } from '@/hooks/useEvents';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { EventCard } from '@/components/EventCard';
import { SpeakerphoneIcon } from '@/components/icons/SpeakerphoneIcon';
import { useMediaQuery } from '@mantine/hooks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import classes from './EventsList.module.css';

export default function EventsListPage() {
  const { events, isLoading: loading, error } = useEvents();
  const t = useTranslations('events');
  const tNav = useTranslations('navigation');
  const locale = useLocale();
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();

  const isMobile = useMediaQuery('(max-width: 48em)');

  // Redirect to on-your-marks if not logged in (either authenticated or anonymous)
  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push(`/${locale}/on-your-marks`);
    }
  }, [currentUser, userLoading, router, locale]);

  // Configure the header for this page
  useHeaderConfig({
    pageTitle: tNav('events'),
    showNavigationLinks: true,
    showLogoText: !isMobile,
  });

  // Show loading while checking authentication
  if (userLoading || !currentUser) {
    return (
      <Box mih="100vh" bg="gray.0">
        <Container size="xl" py="xl">
          <Center>
            <Text c="gray.6">Loading...</Text>
          </Center>
        </Container>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box mih="100vh" bg="gray.0">
        <Container size="xl" py="xl">
          <Center>
            <Text c="gray.6">{t('loadingEvents')}</Text>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box mih="100vh" bg="gray.0">
      <Container size="xl" py="xl">
        {error && (
          <Alert color="red" variant="light" mb="xl">
            {error.message || 'Failed to load events'}
          </Alert>
        )}

        {events.length === 0 ? (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack align="center" gap="md">
              <Text fz={48}>
                <SpeakerphoneIcon size={128} fill="rgba(0,0,0,0.2)" />
              </Text>
              <Title order={2}>{t('noEventsYet')}</Title>
              <Text c="gray.6">{t('createFirstEvent')}</Text>
            </Stack>
          </Card>
        ) : (
          <div className={classes.root}>
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </Container>
    </Box>
  );
}
