'use client';

import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Room } from '@/types/types';
import type { LocationActivity } from '@/types/activity';

// Fix for default marker icon in webpack
const roomIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Create colored user marker icons
const createUserIcon = (color: string, isActive = false) => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="30" height="45">
      <path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 16 8 16s8-10.5 8-16c0-4.42-3.58-8-8-8z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="8" r="3" fill="#fff"/>
    </svg>
  `;

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
          top: 25px;
          left: 15px;
          width: 20px;
          height: 20px;
          border: 3px solid ${color};
          border-radius: 50%;
          animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      </style>
      <div class="pulse-ring"></div>
      <div class="pulse-ring" style="animation-delay: 0.5s;"></div>
    `
    : '';

  return L.divIcon({
    html: `<div style="position: relative;">${pulseAnimation}${svgIcon}</div>`,
    className: 'custom-user-marker',
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
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

interface UserLocationMarker {
  userId: string;
  userName?: string;
  avatarUrl?: string;
  location: LocationActivity;
  timestamp: string;
}

interface RoomMapProps {
  roomName: string;
  location?: Room['location'];
  userLocations?: UserLocationMarker[];
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
  roomPosition,
  userLocations,
}: {
  roomPosition: [number, number];
  userLocations: UserLocationMarker[];
}) {
  const map = useMap();

  useEffect(() => {
    // Collect all positions
    const allPositions: [number, number][] = [roomPosition];

    userLocations.forEach(({ location }) => {
      allPositions.push([location.lat, location.long]);
    });

    // If we only have the room position, just center on it
    if (allPositions.length === 1) {
      map.setView(roomPosition, 15);
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
  }, [roomPosition, userLocations, map]);

  return null;
}

export default function RoomMap({
  roomName,
  location,
  userLocations = [],
}: RoomMapProps) {
  const [mounted, setMounted] = useState(false);
  const [userColorMap, setUserColorMap] = useState<Map<string, string>>(
    new Map()
  );
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    setMounted(true);
  }, []);

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

  console.log('location', location);

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
      <MapContainer
        center={position}
        zoom={location ? 15 : 13}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <MapResizer />
        <MapBoundsUpdater
          roomPosition={position}
          userLocations={userLocations}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Room location marker */}
        <Marker position={position} icon={roomIcon}>
          <Popup>
            <strong>{roomName}</strong>
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

            return (
              <Marker key={userId} position={userPosition} icon={userIcon}>
                <Tooltip
                  direction="top"
                  offset={[0, -40]}
                  opacity={0.9}
                  permanent={true}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid white',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: 'white',
                          border: '2px solid white',
                        }}
                      >
                        {displayName[0]?.toUpperCase()}
                      </div>
                    )}
                    <strong>{displayName}</strong>
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
      </MapContainer>
    </div>
  );
}
