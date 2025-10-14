'use client';

import { useState, useEffect, useRef } from 'react';
import { activityApi } from '@/lib/activity-client';
import { useProfile } from '@/hooks/useProfile';
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

      await activityApi.createActivity(roomSlug, {
        activity_type: 'location',
        data: locationData,
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

          await activityApi.createActivity(roomSlug, {
            activity_type: 'distance',
            data: distanceData,
          });

          // Send speed activity (if speed is > 1 km/h to filter out noise)
          if (speed > 1) {
            const speedData: SpeedActivity = {
              speed: speed,
              unit: 'kmh',
            };

            await activityApi.createActivity(roomSlug, {
              activity_type: 'speed',
              data: speedData,
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
      <div
        style={{
          padding: '1rem',
          background: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
        }}
      >
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem',
          }}
        >
          Activity Tracker
        </h3>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  // Show message for supporters (no tracking permission)
  if (!canTrack(permissions)) {
    return null;
  }

  return (
    <div
      style={{
        padding: '1rem',
        background: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
      }}
    >
      <h3
        style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1rem',
        }}
      >
        Activity Tracker
      </h3>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            padding: '0.75rem',
            background: '#eff6ff',
            borderRadius: '0.375rem',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Distance</div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#2563eb',
            }}
          >
            {totalDistance.toFixed(2)} km
          </div>
        </div>
        <div
          style={{
            padding: '0.75rem',
            background: '#f0fdf4',
            borderRadius: '0.375rem',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Speed</div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#16a34a',
            }}
          >
            {currentSpeed.toFixed(1)} km/h
          </div>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div
          style={{
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: '#6b7280',
          }}
        >
          Status: <span style={{ fontWeight: '500' }}>{status}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.5rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            color: '#dc2626',
          }}
        >
          {error}
        </div>
      )}

      {/* Controls */}
      <button
        onClick={isTracking ? stopTracking : startTracking}
        style={{
          width: '100%',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          fontWeight: '500',
          transition: 'background-color 0.2s',
          background: isTracking ? '#ef4444' : '#3b82f6',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = isTracking ? '#dc2626' : '#2563eb';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = isTracking ? '#ef4444' : '#3b82f6';
        }}
      >
        {isTracking ? 'Stop Tracking' : 'Start Tracking'}
      </button>

      {isTracking ? (
        <p
          style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#6b7280',
          }}
        >
          Your location, speed, and distance are being shared with others in the
          room.
        </p>
      ) : null}
    </div>
  );
}
