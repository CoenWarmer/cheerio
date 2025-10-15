'use client';

import Link from 'next/link';
import {
  Box,
  Container,
  Title,
  Text,
  Stack,
  Alert,
  Center,
  Progress,
  Paper,
  Badge,
  Group,
  Card,
} from '@mantine/core';
import { AppHeader } from '@/components/AppHeader';
import { useEvents } from '@/hooks/useEvents';

export default function EventsListPage() {
  const { events, isLoading: loading, error } = useEvents();

  // Helper function to get status color
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'in_progress':
        return 'blue';
      case 'finished':
        return 'green';
      case 'awaiting':
      default:
        return 'gray';
    }
  };

  // Helper function to get progress percentage based on status
  const getStatusProgress = (status: string | null) => {
    switch (status) {
      case 'finished':
        return 100;
      case 'in_progress':
        return 50;
      case 'awaiting':
      default:
        return 10;
    }
  };

  // Helper function to format status text
  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'finished':
        return 'Finished';
      case 'awaiting':
      default:
        return 'Awaiting';
    }
  };

  if (loading) {
    return (
      <Box mih="100vh" bg="gray.0">
        <AppHeader pageTitle="Events" />
        <Container size="xl" py="xl">
          <Center>
            <Text c="gray.6">Loading events...</Text>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box mih="100vh" bg="gray.0">
      <AppHeader pageTitle="Events" />
      <Container size="xl" py="xl">
        {error && (
          <Alert color="red" variant="light" mb="xl">
            {error.message || 'Failed to load events'}
          </Alert>
        )}

        {events.length === 0 ? (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack align="center" gap="md">
              <Text fz={48}>🏠</Text>
              <Title order={2}>No events yet</Title>
              <Text c="gray.6">Create your first event to get started!</Text>
            </Stack>
          </Card>
        ) : (
          <Stack gap="md">
            {events.map(event => (
              <Paper
                key={event.id}
                component={Link}
                href={`/event/${event.slug}`}
                shadow="xs"
                p="xl"
                radius="md"
                withBorder
                style={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow =
                    '0 2px 8px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#228be6';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow =
                    '0 1px 3px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#dee2e6';
                }}
              >
                <Group justify="space-between" align="flex-start" mb="md">
                  <Box style={{ flex: 1 }}>
                    <Group gap="sm" mb="xs">
                      <Title order={3} size="h3" fw={600} c="gray.9">
                        {event.name}
                      </Title>
                      {event.is_private && (
                        <Badge color="yellow" variant="light" size="sm">
                          🔒 Private
                        </Badge>
                      )}
                    </Group>
                    {event.description && (
                      <Text size="sm" c="gray.6" lineClamp={2} mb="md">
                        {event.description}
                      </Text>
                    )}
                  </Box>
                  <Badge
                    color={getStatusColor(event.status)}
                    variant="light"
                    size="lg"
                    radius="sm"
                  >
                    {getStatusText(event.status)}
                  </Badge>
                </Group>

                <Progress
                  value={getStatusProgress(event.status)}
                  color={getStatusColor(event.status)}
                  size="sm"
                  radius="xl"
                  mb="sm"
                />

                <Group justify="space-between">
                  <Text size="xs" c="gray.5">
                    Created{' '}
                    {new Date(event.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  {event.start_time && (
                    <Text size="xs" c="gray.5">
                      Starts{' '}
                      {new Date(event.start_time).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
