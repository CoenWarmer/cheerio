'use client';

import { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Event } from '@/types/types';
import type { LocationActivity } from '@/types/activity';
import type { TrackingPath } from '@/hooks/useTrackingPaths';
import { Button } from '@mantine/core';
import { ConfettiIcon } from './icons/ConfettiIcon';
import { useSendMessage } from '@/hooks/useMessages';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import confetti from 'canvas-confetti';

const flagIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#228be6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-flag"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z" /><path d="M5 21v-7" /></svg>`,
  className: 'custom-flag-marker',
  iconSize: [60, 60],
  iconAnchor: [15, 45],
  popupAnchor: [0, -45],
});

// Create colored user marker icons
const createUserIcon = (color: string, isActive = false) => {
  // Running person icon (when active)
  const runningIcon = `<svg 
  xmlns="http://www.w3.org/2000/svg"
  height="24px"
  viewBox="0 -960 960 960" width="24px"
  fill="${color}"
>
  <path d="M520-40v-240l-84-80-40 176-276-56 16-80 192 40 64-324-72 28v136h-80v-188l158-68q35-15 51.5-19.5T480-720q21 0 39 11t29 29l40 64q26 42 70.5 69T760-520v80q-66 0-123.5-27.5T540-540l-24 120 84 80v300h-80Zm20-700q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z"/>
</svg>`;

  // Standing person icon (when inactive)
  const standingIcon = `<svg
  xmlns="http://www.w3.org/2000/svg"
  height="24px"
  viewBox="0 -960 960 960"
  width="24px"
  fill="${color}"
>
  <path d="M360-80v-529q-91-24-145.5-100.5T160-880h80q0 83 53.5 141.5T430-680h100q30 0 56 11t47 32l181 181-56 56-158-158v478h-80v-240h-80v240h-80Zm120-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z"/>
</svg>`;

  const svgIcon = isActive ? runningIcon : standingIcon;

  const pulseAnimation = isActive
    ? `
      <style>
        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.6);
            opacity: 0;
          }
        }
        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 35px;
          height: 35px;
          border: 3px solid ${color};
          border-radius: 50%;
          animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      </style>
      <div class="pulse-ring"></div>
    `
    : '';

  return L.divIcon({
    html: `
      <div style="position: relative; background: white; border: 3px solid ${color}; border-radius: 50%; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
        ${pulseAnimation}
        ${svgIcon}
      </div>
    `,
    className: 'custom-user-marker',
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -23],
  });
};

// Color palette for different users
const userColors = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

// Create emoji marker icons
const createEmojiIcon = (emoji: string) => {
  return L.divIcon({
    html: `
      <div style="
        background: white;
        border: 3px solid #3b82f6;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      ">
        ${emoji}
      </div>
    `,
    className: 'custom-emoji-marker',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50],
  });
};

interface UserLocationMarker {
  userId: string;
  userName?: string;
  avatarUrl?: string;
  location: LocationActivity;
  timestamp: string;
}

interface EmojiMarker {
  id: string;
  emoji: string;
  userName: string;
  location: LocationActivity;
  timestamp: string;
  distance?: number;
}

interface EventMapProps {
  eventName: string;
  location?: Event['location'];
  userLocations?: UserLocationMarker[];
  emojiMarkers?: EmojiMarker[];
  trackingPaths?: TrackingPath[];
  selectedUserId?: string | null;
  eventSlug?: string;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    // Small delay to ensure container is properly sized
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

function MapBoundsUpdater({
  eventPosition,
  userLocations,
}: {
  eventPosition: [number, number];
  userLocations: UserLocationMarker[];
}) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only auto-adjust bounds on initial load
    if (hasInitialized.current) return;

    // Collect all positions
    const allPositions: [number, number][] = [eventPosition];

    userLocations.forEach(({ location }) => {
      allPositions.push([location.lat, location.long]);
    });

    // If we only have the event position, just center on it
    if (allPositions.length === 1) {
      map.setView(eventPosition, 15);
      hasInitialized.current = true;
      return;
    }

    // Calculate bounds to include all markers
    const bounds = L.latLngBounds(allPositions);

    // Fit the map to these bounds with padding
    // Extra padding on right side (400px) to account for chat sidebar
    map.fitBounds(bounds, {
      paddingTopLeft: [50, 50], // Left and top padding
      paddingBottomRight: [450, 50], // Right padding (400px sidebar + 50px buffer) and bottom
      maxZoom: 16, // Don't zoom in too much
    });

    hasInitialized.current = true;
  }, [eventPosition, userLocations, map]);

  return null;
}

function MapClickHandler({
  confettiMode,
  eventSlug,
  onMessageSent,
}: {
  confettiMode: boolean;
  eventSlug: string;
  onMessageSent: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    click: e => {
      if (confettiMode && eventSlug) {
        const { lat, lng } = e.latlng;

        // Get the container point (pixel coordinates) from the lat/lng
        const point = map.latLngToContainerPoint(e.latlng);

        // Get the map container's bounding rect to calculate position relative to viewport
        const mapContainer = map.getContainer();
        const rect = mapContainer.getBoundingClientRect();

        // Calculate normalized coordinates (0 to 1) for confetti
        const x = (rect.left + point.x) / window.innerWidth;
        const y = (rect.top + point.y) / window.innerHeight;

        // Trigger confetti explosion at the click location
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x, y },
          colors: ['#228be6', '#ff6b6b', '#51cf66', '#ffd43b', '#ff8787'],
          ticks: 200,
        });

        onMessageSent(lat, lng);
      }
    },
  });

  return null;
}

export default function EventMap({
  eventName,
  location,
  userLocations = [],
  emojiMarkers = [],
  trackingPaths = [],
  selectedUserId = null,
  eventSlug,
}: EventMapProps) {
  const [mounted, setMounted] = useState(false);
  const [userColorMap, setUserColorMap] = useState<Map<string, string>>(
    new Map()
  );
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [confettiMode, setConfettiMode] = useState(false);

  const { sendMessage } = useSendMessage();
  const { currentUser } = useCurrentUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    if (!eventSlug || !currentUser?.id) return;

    const messageData = {
      content: `🎉`,
      location: { lat, long: lng },
      user_id: currentUser.id,
    };

    sendMessage({ eventId: eventSlug, messageData });
  };

  // Update current time every 5 seconds to re-evaluate active tracking status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Assign consistent colors to users
  useEffect(() => {
    const newColorMap = new Map(userColorMap);
    let colorIndex = newColorMap.size;

    userLocations.forEach(({ userId }) => {
      if (!newColorMap.has(userId)) {
        newColorMap.set(userId, userColors[colorIndex % userColors.length]);
        colorIndex++;
      }
    });

    if (newColorMap.size !== userColorMap.size) {
      setUserColorMap(newColorMap);
    }
  }, [userLocations, userColorMap]);

  if (!mounted) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f3f4f6',
        }}
      >
        <p style={{ color: '#6b7280' }}>Loading map...</p>
      </div>
    );
  }

  // Parse and validate location
  let position: [number, number] = [37.7749, -122.4194]; // Default: San Francisco

  if (
    location &&
    typeof location === 'object' &&
    'lat' in location &&
    'long' in location &&
    typeof location.lat === 'number' &&
    typeof location.long === 'number'
  ) {
    position = [location.lat, location.long];
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>
        {`
          /* Override Leaflet's default tooltip styles for Mantine aesthetic */
          .mantine-tooltip.leaflet-tooltip {
            background-color: transparent;
            border: none;
            box-shadow: none;
            padding: 0;
            margin: 0;
          }
          
          .mantine-tooltip.leaflet-tooltip::before {
            display: none;
          }
          
          /* Keep pointer cursor for clickable elements */
          .leaflet-interactive {
            cursor: pointer;
          }
        `}
      </style>
      <Button
        variant="filled"
        onClick={() => setConfettiMode(!confettiMode)}
        style={{
          position: 'absolute',
          borderRadius: 100,
          height: 60,
          width: 60,
          top: '40%',
          left: 10,
          zIndex: 500,
          boxShadow: '2px 2px 2px rgba(0,0,0,0.2)',
          backgroundColor: confettiMode ? '#ff6b6b' : '#228be6',
          opacity: confettiMode ? 1 : 0.9,
          transform: confettiMode ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.3s ease',
        }}
        title={
          confettiMode
            ? 'Confetti mode active - click map to celebrate!'
            : 'Click to enable confetti mode'
        }
      >
        <ConfettiIcon size={60} />
      </Button>
      <MapContainer
        center={position}
        zoom={location ? 15 : 13}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <MapResizer />
        <MapBoundsUpdater
          eventPosition={position}
          userLocations={userLocations}
        />
        <SelectedUserFollower
          selectedUserId={selectedUserId}
          userLocations={userLocations}
        />
        {eventSlug && (
          <MapClickHandler
            confettiMode={confettiMode}
            eventSlug={eventSlug}
            onMessageSent={handleMapClick}
          />
        )}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=${process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY}`}
        />

        {/* Event location marker */}
        <Marker position={position} icon={flagIcon}>
          <Popup>
            <strong>{eventName}</strong>
            <br />
            {location &&
            typeof location === 'object' &&
            'lat' in location &&
            'long' in location &&
            typeof location.lat === 'number' &&
            typeof location.long === 'number' ? (
              <>
                📍 {location.lat.toFixed(6)}, {location.long.toFixed(6)}
              </>
            ) : (
              'No location set'
            )}
          </Popup>
        </Marker>

        {/* User location markers */}
        {userLocations.map(
          ({ userId, userName, avatarUrl, location, timestamp }) => {
            const userPosition: [number, number] = [
              location.lat,
              location.long,
            ];

            const color = userColorMap.get(userId) || userColors[0];

            // Calculate time since last update (using currentTime to trigger re-renders)
            const timeSince = currentTime - new Date(timestamp).getTime();
            const minutesAgo = Math.floor(timeSince / 1000 / 60);
            const timeText =
              minutesAgo < 1
                ? 'just now'
                : minutesAgo < 60
                  ? `${minutesAgo}m ago`
                  : `${Math.floor(minutesAgo / 60)}h ago`;

            // Check if actively tracking (last update within 15 seconds)
            const isActivelyTracking = timeSince < 15000; // 15 seconds
            const userIcon = createUserIcon(color, isActivelyTracking);

            const displayName = userName || `User ${userId.substring(0, 8)}`;

            // Use a key that includes timestamp to force re-render when location updates
            const markerKey = `${userId}-${timestamp}`;

            return (
              <Marker key={markerKey} position={userPosition} icon={userIcon}>
                <Tooltip
                  direction="top"
                  offset={[0, -30]}
                  opacity={1}
                  permanent={true}
                  className="mantine-tooltip"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      background: '#fff',
                      borderRadius: '8px',
                      boxShadow:
                        '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
                      border: `2px solid ${color}`,
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'white',
                          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05)',
                        }}
                      >
                        {displayName[0]?.toUpperCase()}
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#212529',
                        lineHeight: '1.55',
                      }}
                    >
                      {displayName}
                    </span>
                  </div>
                </Tooltip>
                <Popup>
                  <div>
                    <strong>{displayName}</strong>
                    <br />
                    📍 {location.lat.toFixed(6)}, {location.long.toFixed(6)}
                    <br />
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Updated: {timeText}
                    </span>
                    {location.accuracy && (
                      <>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Accuracy: ±{Math.round(location.accuracy)}m
                        </span>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          }
        )}

        {/* Emoji markers */}
        {emojiMarkers.map(
          ({ id, emoji, userName, location, timestamp, distance }) => {
            const emojiPosition: [number, number] = [
              location.lat,
              location.long,
            ];
            const emojiIcon = createEmojiIcon(emoji);

            const timeSince = currentTime - new Date(timestamp).getTime();
            const minutesAgo = Math.floor(timeSince / 1000 / 60);
            const timeText =
              minutesAgo < 1
                ? 'just now'
                : minutesAgo < 60
                  ? `${minutesAgo}m ago`
                  : `${Math.floor(minutesAgo / 60)}h ago`;

            return (
              <Marker key={id} position={emojiPosition} icon={emojiIcon}>
                <Tooltip
                  direction="top"
                  offset={[0, -50]}
                  opacity={1}
                  className="mantine-tooltip"
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#fff',
                      borderRadius: '8px',
                      boxShadow:
                        '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
                      border: '2px solid #3b82f6',
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#212529',
                        marginBottom: '4px',
                      }}
                    >
                      {userName}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#868e96',
                        lineHeight: '1.55',
                      }}
                    >
                      {timeText}
                      {distance !== undefined && (
                        <> • {distance.toFixed(2)} km</>
                      )}
                    </div>
                  </div>
                </Tooltip>
                <Popup>
                  <div>
                    <div
                      style={{
                        fontSize: '32px',
                        textAlign: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      {emoji}
                    </div>
                    <strong>{userName}</strong>
                    <br />
                    📍 {location.lat.toFixed(6)}, {location.long.toFixed(6)}
                    <br />
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {timeText}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          }
        )}

        {/* Tracking path polylines */}
        {trackingPaths.map(path => {
          if (path.coordinates.length < 2) return null;

          const positions: [number, number][] = path.coordinates.map(coord => [
            coord.lat,
            coord.lng,
          ]);

          return (
            <Polyline
              key={path.userId}
              positions={positions}
              color={path.color}
              weight={3}
              opacity={0.7}
            >
              <Tooltip
                direction="top"
                opacity={1}
                sticky
                className="mantine-tooltip"
              >
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow:
                      '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
                    border: `2px solid ${path.color}`,
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#212529',
                      marginBottom: '4px',
                    }}
                  >
                    {path.userName || `User ${path.userId.substring(0, 8)}`}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#868e96',
                      lineHeight: '1.55',
                    }}
                  >
                    {path.coordinates.length} points tracked
                  </div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}
      </MapContainer>
    </div>
  );
}

function SelectedUserFollower({
  selectedUserId,
  userLocations,
}: {
  selectedUserId: string | null;
  userLocations: UserLocationMarker[];
}) {
  const map = useMap();
  const hasInitialized = useRef(false);
  const lastSelectedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedUserId) {
      // Reset when user is deselected
      hasInitialized.current = false;
      lastSelectedUserId.current = null;
      return;
    }

    // Find the selected user's location
    const selectedUser = userLocations.find(
      user => user.userId === selectedUserId
    );

    if (!selectedUser) return;

    const newPosition: [number, number] = [
      selectedUser.location.lat,
      selectedUser.location.long,
    ];

    // Check if this is a new user selection (not just a location update)
    const isNewSelection = lastSelectedUserId.current !== selectedUserId;
    lastSelectedUserId.current = selectedUserId;

    if (isNewSelection || !hasInitialized.current) {
      // Initial selection: fly to with zoom level 16
      map.flyTo(newPosition, 16, {
        duration: 1,
        easeLinearity: 0.25,
      });
      hasInitialized.current = true;
    } else {
      // Subsequent updates: pan to new position, preserving current zoom
      map.panTo(newPosition, {
        animate: true,
        duration: 0.5,
        easeLinearity: 0.25,
      });
    }
  }, [selectedUserId, userLocations, map]);

  return null;
}
