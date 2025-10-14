'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  SimpleGrid,
  Text,
  Button,
  Alert,
  Stack,
} from '@mantine/core';
import { useProfile } from '@/hooks/useProfile';
import { useCreateActivity } from '@/hooks/useActivity';
import { canTrack } from '@/types/permissions';
import type {
  LocationActivity,
  SpeedActivity,
  DistanceActivity,
} from '@/types/activity';

interface ActivityTrackerProps {
  roomSlug: string;
}

export default function ActivityTracker({ roomSlug }: ActivityTrackerProps) {
  const { permissions, loading } = useProfile();
  const { createActivity } = useCreateActivity();

  const [isTracking, setIsTracking] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const distanceRef = useRef(0);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate speed in km/h
  const calculateSpeed = (
    distance: number,
    timeDiffSeconds: number
  ): number => {
    if (timeDiffSeconds === 0) return 0;
    return (distance / timeDiffSeconds) * 3600; // Convert to km/h
  };

  const handlePositionUpdate = async (position: GeolocationPosition) => {
    try {
      const { latitude, longitude, accuracy } = position.coords;

      // Send location activity
      const locationData: LocationActivity = {
        lat: latitude,
        long: longitude,
        accuracy: accuracy,
        timestamp: position.timestamp,
      };

      createActivity({
        roomSlug,
        activity: {
          activity_type: 'location',
          data: locationData,
        },
      });

      // Calculate distance and speed if we have a previous position
      if (lastPositionRef.current) {
        const prevCoords = lastPositionRef.current.coords;
        const distance = calculateDistance(
          prevCoords.latitude,
          prevCoords.longitude,
          latitude,
          longitude
        );

        // Only update if movement is significant (> 10 meters)
        if (distance > 0.01) {
          distanceRef.current += distance;
          setTotalDistance(distanceRef.current);

          const timeDiff =
            (position.timestamp - lastPositionRef.current.timestamp) / 1000;
          const speed = calculateSpeed(distance, timeDiff);
          // Only update display if speed is above threshold (filters GPS noise)
          setCurrentSpeed(speed > 1 ? speed : 0);

          // Send distance activity
          const distanceData: DistanceActivity = {
            distance: distanceRef.current,
            unit: 'km',
          };

          createActivity({
            roomSlug,
            activity: {
              activity_type: 'distance',
              data: distanceData,
            },
          });

          // Send speed activity (if speed is > 1 km/h to filter out noise)
          if (speed > 1) {
            const speedData: SpeedActivity = {
              speed: speed,
              unit: 'kmh',
            };

            createActivity({
              roomSlug,
              activity: {
                activity_type: 'speed',
                data: speedData,
              },
            });
          }
        }
      }

      lastPositionRef.current = position;
      setStatus('Tracking...');
      setError(null);
    } catch (err) {
      console.error('Error updating position:', err);
      setError('Failed to update location');
    }
  };

  const handleError = (error: GeolocationPositionError) => {
    console.error('Geolocation error:', error);
    setError(`Location error: ${error.message}`);
    setStatus('Error');
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setStatus('Starting...');
    setError(null);
    distanceRef.current = 0;
    setTotalDistance(0);
    setCurrentSpeed(0);
    lastPositionRef.current = null;

    // Watch position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setStatus('Stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Text ta="center" c="gray.6">
          Loading...
        </Text>
      </Card>
    );
  }

  // Show message for supporters (no tracking permission)
  if (!canTrack(permissions)) {
    return null;
  }

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="md">
        {/* Stats */}
        <SimpleGrid cols={2} spacing="md">
          <Box p="sm" bg="blue.0" style={{ borderRadius: '0.375rem' }}>
            <Text size="sm" c="gray.6">
              Distance
            </Text>
            <Text size="xl" fw={700} c="blue.6">
              {totalDistance.toFixed(2)} km
            </Text>
          </Box>
          <Box p="sm" bg="green.0" style={{ borderRadius: '0.375rem' }}>
            <Text size="sm" c="gray.6">
              Speed
            </Text>
            <Text size="xl" fw={700} c="green.6">
              {currentSpeed.toFixed(1)} km/h
            </Text>
          </Box>
        </SimpleGrid>

        {/* Status */}
        {status && (
          <Text size="sm" c="gray.6">
            Status:{' '}
            <Text component="span" fw={500}>
              {status}
            </Text>
          </Text>
        )}

        {/* Error */}
        {error && (
          <Alert color="red" variant="light" title="Error">
            {error}
          </Alert>
        )}

        {/* Controls */}
        <Button
          onClick={isTracking ? stopTracking : startTracking}
          color={isTracking ? 'red' : 'blue'}
          fullWidth
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Button>

        {isTracking && (
          <Text size="xs" c="gray.6">
            Your location, speed, and distance are being shared with others in
            the room.
          </Text>
        )}
      </Stack>
    </Card>
  );
}
