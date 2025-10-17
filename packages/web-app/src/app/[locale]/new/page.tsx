'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useCreateEvent } from '@/hooks/useEvents';
import { ApiError } from '@/lib/api/api-client';
import { getCurrentLocation, isValidCoordinates } from '@/utils/location';

import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useProfile } from '@/hooks/useProfile';
import { useMediaQuery } from '@mantine/hooks';

type EventStatus = 'awaiting' | 'in_progress' | 'finished';

export default function NewEventPage() {
  const router = useRouter();
  const t = useTranslations('newEvent');
  const tNav = useTranslations('navigation');
  const { currentUser, isAuthenticated } = useCurrentUser();
  const { createEventAsync, isCreating } = useCreateEvent();
  const { permissions } = useProfile();

  const [title, setTitle] = useState('');
  const [locationLabel, setLocationlabel] = useState('');
  const [description, setDescription] = useState('');
  const [donationLink, setDonationLink] = useState('');
  const [startTime, setStartTime] = useState('');
  const [status, setStatus] = useState<EventStatus>('awaiting');
  const [isPrivate, setIsPrivate] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [error, setError] = useState('');
  const isMobile = useMediaQuery('(max-width: 48em)');

  useHeaderConfig({
    pageTitle: tNav('new'),
    showNavigationLinks: true,
    showLogoText: !isMobile,
  });

  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const coords = await getCurrentLocation();
      setLatitude(coords.lat.toString());
      setLongitude(coords.long.toString());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('locationPermissionError')
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!title.trim()) {
      setError(t('titleRequired'));
      return;
    }

    // Validate coordinates if provided
    let locationJson = null;
    if (latitude.trim() && longitude.trim()) {
      const lat = parseFloat(latitude);
      const long = parseFloat(longitude);

      if (isNaN(lat) || isNaN(long)) {
        setError(t('invalidCoordinates'));
        return;
      }

      if (!isValidCoordinates({ lat, long })) {
        setError(t('invalidCoordinatesRange'));
        return;
      }

      // Store as JSON object
      locationJson = { lat, long };
    }

    try {
      if (!currentUser?.id) {
        setError(t('mustBeLoggedIn'));
        return;
      }

      // Note: Only authenticated users can create events (enforced by RLS)
      // Anonymous users will be blocked at the database level
      if (!isAuthenticated) {
        setError(t('mustBeLoggedIn'));
        return;
      }

      // Prepare event data
      const eventData = {
        name: title.trim(),
        description: description.trim() || null,
        donation_link: donationLink.trim() || null,
        start_time: startTime ? new Date(startTime).toISOString() : null,
        status: status,
        is_private: isPrivate,
        created_by: currentUser.id,
        location: locationJson,
        locationLabel: locationLabel,
      };

      // Call API route to create event using Tanstack Query mutation
      const result = await createEventAsync(eventData);

      if (result.data) {
        // Redirect to the newly created event
        router.push(`/event/${result.data.slug}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t('error'));
      }
      console.error(err);
    }
  };

  return (
    <Box mih="100vh" bg="gray.0">
      <Container size="md" py="xl">
        <Paper shadow="sm" radius="md" withBorder>
          {permissions !== 'admin' ? (
            <Alert color="blue" variant="light" mb="md">
              <Text size="sm">
                <strong>{t('tip')}</strong> {t('tipMessage')}
              </Text>
            </Alert>
          ) : null}

          <Box px="md" mt={permissions !== 'admin' ? 0 : 'md'} py="md">
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label={t('eventTitle')}
                  placeholder={t('eventTitlePlaceholder')}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  withAsterisk
                />

                <Textarea
                  label={t('description')}
                  placeholder={t('descriptionPlaceholder')}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                />

                <TextInput
                  label={t('startTime')}
                  type="datetime-local"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  description={t('startTimeDescription')}
                />

                <Select
                  label={t('status')}
                  value={status}
                  onChange={value => setStatus(value as EventStatus)}
                  data={[
                    { value: 'awaiting', label: t('statusAwaiting') },
                    { value: 'in_progress', label: t('statusInProgress') },
                    { value: 'finished', label: t('statusFinished') },
                  ]}
                />

                <Paper p="md" withBorder bg="gray.0">
                  <Stack gap="md">
                    <TextInput
                      label={t('location')}
                      type="text"
                      value={locationLabel}
                      onChange={e => setLocationlabel(e.target.value)}
                      description={t('locationDescription')}
                    />
                    <Group justify="space-between" align="center">
                      <Text size="sm" fw={500}>
                        {t('startFinishLocation')}
                      </Text>
                      <Button
                        size="xs"
                        onClick={handleGetCurrentLocation}
                        loading={loadingLocation}
                      >
                        {loadingLocation
                          ? t('gettingLocation')
                          : t('useMyLocation')}
                      </Button>
                    </Group>

                    <Group grow>
                      <NumberInput
                        label={t('latitude')}
                        placeholder="37.7749"
                        value={latitude}
                        onChange={value => setLatitude(String(value))}
                        decimalScale={6}
                        hideControls
                      />
                      <NumberInput
                        label={t('longitude')}
                        placeholder="-122.4194"
                        value={longitude}
                        onChange={value => setLongitude(String(value))}
                        decimalScale={6}
                        hideControls
                      />
                    </Group>

                    <Text size="xs" c="gray.6">
                      {t('locationInstructions')}
                    </Text>
                  </Stack>
                </Paper>

                <TextInput
                  label={t('donationLink')}
                  type="url"
                  placeholder={t('donationLinkPlaceholder')}
                  value={donationLink}
                  onChange={e => setDonationLink(e.target.value)}
                  description={t('donationLinkDescription')}
                />

                <Checkbox
                  label={t('makePrivate')}
                  description={t('makePrivateDescription')}
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.currentTarget.checked)}
                />

                {error && (
                  <Alert color="red" variant="light">
                    {error}
                  </Alert>
                )}

                <Group justify="flex-end" gap="md" mt="md" mb="md">
                  <Button
                    component={Link}
                    href="/events"
                    variant="default"
                    size="sm"
                  >
                    {t('cancel')}
                  </Button>
                  <Button type="submit" loading={isCreating} size="sm">
                    {isCreating ? t('creating') : t('create')}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
