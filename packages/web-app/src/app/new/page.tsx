'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  Title,
  Text,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Checkbox,
  Button,
  Group,
  Stack,
  Alert,
  Paper,
  Anchor,
} from '@mantine/core';
import { supabase } from '@/lib/supabase';
import { useCreateEvent } from '@/hooks/useEvents';
import { ApiError } from '@/lib/api-client';
import { getCurrentLocation, isValidCoordinates } from '@/utils/location';

type EventStatus = 'awaiting' | 'in_progress' | 'finished';

export default function NewEventPage() {
  const router = useRouter();
  const { createEventAsync, isCreating } = useCreateEvent();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [donationLink, setDonationLink] = useState('');
  const [startTime, setStartTime] = useState('');
  const [status, setStatus] = useState<EventStatus>('awaiting');
  const [isPrivate, setIsPrivate] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [error, setError] = useState('');

  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const coords = await getCurrentLocation();
      setLatitude(coords.lat.toString());
      setLongitude(coords.long.toString());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to get your location. Please check permissions.'
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
      setError('Title is required');
      return;
    }

    // Validate coordinates if provided
    let locationJson = null;
    if (latitude.trim() && longitude.trim()) {
      const lat = parseFloat(latitude);
      const long = parseFloat(longitude);

      if (isNaN(lat) || isNaN(long)) {
        setError('Invalid coordinates. Please enter valid numbers.');
        return;
      }

      if (!isValidCoordinates({ lat, long })) {
        setError(
          'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.'
        );
        return;
      }

      // Store as JSON object
      locationJson = { lat, long };
    }

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to create a event');
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
        created_by: user.id,
        location: locationJson,
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
        setError('Failed to create event. Please try again.');
      }
      console.error(err);
    }
  };

  return (
    <Box mih="100vh" bg="gray.0">
      <Box bg="white" style={{ borderBottom: '1px solid #e5e7eb' }} py="md">
        <Container size="xl">
          <Group justify="space-between" align="center">
            <Title order={1}>Create New Event</Title>
            <Anchor component={Link} href="/events" c="gray.6" size="sm">
              ← Back to Events
            </Anchor>
          </Group>
        </Container>
      </Box>

      <Container size="md" py="xl">
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Event Title"
                placeholder="Enter event title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                withAsterisk
              />

              <Textarea
                label="Description"
                placeholder="Describe your event..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
              />

              <TextInput
                label="Donation Link"
                type="url"
                placeholder="https://example.com/donate"
                value={donationLink}
                onChange={e => setDonationLink(e.target.value)}
                description="Optional: Add a link where people can donate"
              />

              <TextInput
                label="Start Time"
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                description="Optional: When does this event start?"
              />

              <Select
                label="Status"
                value={status}
                onChange={value => setStatus(value as EventStatus)}
                data={[
                  { value: 'awaiting', label: 'Awaiting' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'finished', label: 'Finished' },
                ]}
              />

              <Paper p="md" withBorder bg="gray.0">
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Text size="sm" fw={500}>
                      📍 Location (Optional)
                    </Text>
                    <Button
                      size="xs"
                      onClick={handleGetCurrentLocation}
                      loading={loadingLocation}
                    >
                      {loadingLocation
                        ? 'Getting location...'
                        : '📍 Use My Location'}
                    </Button>
                  </Group>

                  <Group grow>
                    <NumberInput
                      label="Latitude"
                      placeholder="37.7749"
                      value={latitude}
                      onChange={value => setLatitude(String(value))}
                      decimalScale={6}
                      hideControls
                    />
                    <NumberInput
                      label="Longitude"
                      placeholder="-122.4194"
                      value={longitude}
                      onChange={value => setLongitude(String(value))}
                      decimalScale={6}
                      hideControls
                    />
                  </Group>

                  <Text size="xs" c="gray.6">
                    Set the location for your event. Click Use My Location or
                    enter coordinates manually.
                  </Text>
                </Stack>
              </Paper>

              <Checkbox
                label="🔒 Make this event private"
                description="Private events are only visible to invited members"
                checked={isPrivate}
                onChange={e => setIsPrivate(e.currentTarget.checked)}
              />

              {error && (
                <Alert color="red" variant="light">
                  {error}
                </Alert>
              )}

              <Group justify="flex-end" gap="md">
                <Button
                  component={Link}
                  href="/events"
                  variant="default"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isCreating} size="sm">
                  {isCreating ? 'Creating...' : 'Create Event'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>

        <Alert color="blue" variant="light" mt="xl">
          <Text size="sm">
            <strong>💡 Tip:</strong> After creating your event, you can share
            the link with others to join. Use the chat to communicate in
            real-time!
          </Text>
        </Alert>
      </Container>
    </Box>
  );
}
