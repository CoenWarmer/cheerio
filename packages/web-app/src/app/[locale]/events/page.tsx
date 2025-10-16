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
import { useTranslations } from 'next-intl';
import { useEvents } from '@/hooks/useEvents';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { EventCard } from '@/components/EventCard';
import classes from './EventsList.module.css';
import { SpeakerphoneIcon } from '@/components/icons/SpeakerphoneIcon';

export default function EventsListPage() {
  const { events, isLoading: loading, error } = useEvents();
  const t = useTranslations('events');
  const tNav = useTranslations('navigation');

  // Configure the header for this page
  useHeaderConfig({
    pageTitle: tNav('events'),
    showNavigationLinks: true,
  });

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
