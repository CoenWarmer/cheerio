'use client';

import { useState } from 'react';
import {
  Stack,
  Card,
  Text,
  Alert,
  Group,
  Avatar,
  Select,
  Box,
  SimpleGrid,
} from '@mantine/core';
import { useActivitySummary } from '@/hooks/useActivitySummary';

interface UserActivityFeedProps {
  roomSlug: string;
  roomId: string;
}

export default function UserActivityFeed({
  roomSlug,
  roomId,
}: UserActivityFeedProps) {
  // Fetch pre-processed summaries from server
  const { summaries, isLoading, error } = useActivitySummary(roomId, roomSlug);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (error) {
    return (
      <Alert color="red" variant="light" title="Error">
        {error.message || 'Failed to load activity'}
      </Alert>
    );
  }

  // Server already filters out current user
  const otherUsers = summaries;

  if (isLoading) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Text size="sm" c="gray.6">
          Loading activity...
        </Text>
      </Card>
    );
  }

  if (otherUsers.length === 0) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Text size="sm" c="gray.7">
          No other users are currently sharing their activity.
        </Text>
      </Card>
    );
  }

  // Filter to show only selected user or all users
  const usersToDisplay =
    selectedUserId && otherUsers.length > 1
      ? otherUsers.filter(u => u.userId === selectedUserId)
      : otherUsers;

  return (
    <Stack gap={0}>
      {/* Dropdown selector when multiple users */}
      {otherUsers.length > 1 && (
        <Box px="md" pb="md">
          <Select
            value={selectedUserId || 'all'}
            onChange={value =>
              setSelectedUserId(value === 'all' ? null : value)
            }
            data={[
              { value: 'all', label: `All Users (${otherUsers.length})` },
              ...otherUsers.map(summary => ({
                value: summary.userId,
                label:
                  summary.userName || `User ${summary.userId.substring(0, 8)}`,
              })),
            ]}
          />
        </Box>
      )}

      <Stack gap="sm" px="md" pb="md">
        {usersToDisplay.map(summary => {
          const displayName =
            summary.userName || `User ${summary.userId.substring(0, 8)}`;
          const initials =
            summary.userName
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2) || summary.userId.substring(0, 2).toUpperCase();

          return (
            <Card
              key={summary.userId}
              shadow="sm"
              padding="md"
              radius="md"
              withBorder
            >
              <Group mb="sm">
                <Avatar color="blue" radius="xl">
                  {initials}
                </Avatar>
                <Text fw={500}>{displayName}</Text>
              </Group>

              <SimpleGrid cols={2} spacing="xs">
                {summary.lastLocation && (
                  <Box p="xs" bg="blue.0" style={{ borderRadius: '0.375rem' }}>
                    <Text size="xs" c="gray.7" mb={4}>
                      Location
                    </Text>
                    <Text fw={500} c="blue.8">
                      {summary.lastLocation.lat.toFixed(5)},{' '}
                      {summary.lastLocation.long.toFixed(5)}
                    </Text>
                    <Text size="xs" c="gray.6" mt={4}>
                      {formatTime(summary.lastLocation.timestamp)}
                    </Text>
                  </Box>
                )}

                {summary.lastSpeed && (
                  <Box p="xs" bg="green.0" style={{ borderRadius: '0.375rem' }}>
                    <Text size="xs" c="gray.7" mb={4}>
                      Speed
                    </Text>
                    <Text fw={500} c="green.8">
                      {summary.lastSpeed.speed.toFixed(1)}{' '}
                      {summary.lastSpeed.unit}
                    </Text>
                    <Text size="xs" c="gray.6" mt={4}>
                      {formatTime(summary.lastSpeed.timestamp)}
                    </Text>
                  </Box>
                )}

                {summary.lastDistance && (
                  <Box
                    p="xs"
                    bg="violet.0"
                    style={{ borderRadius: '0.375rem' }}
                  >
                    <Text size="xs" c="gray.7" mb={4}>
                      Distance
                    </Text>
                    <Text fw={500} c="violet.8">
                      {summary.lastDistance.distance.toFixed(2)}{' '}
                      {summary.lastDistance.unit}
                    </Text>
                    <Text size="xs" c="gray.6" mt={4}>
                      {formatTime(summary.lastDistance.timestamp)}
                    </Text>
                  </Box>
                )}

                {summary.lastMusic && (
                  <Box
                    p="xs"
                    bg="pink.0"
                    style={{ borderRadius: '0.375rem', gridColumn: 'span 2' }}
                  >
                    <Text size="xs" c="gray.7" mb={4}>
                      🎵 Listening to
                    </Text>
                    <Text fw={500} c="pink.8">
                      {summary.lastMusic.title}
                    </Text>
                    <Text size="sm" c="pink.7">
                      {summary.lastMusic.artist}
                    </Text>
                    <Text size="xs" c="gray.6" mt={4}>
                      {formatTime(summary.lastMusic.timestamp)}
                    </Text>
                  </Box>
                )}
              </SimpleGrid>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
}
