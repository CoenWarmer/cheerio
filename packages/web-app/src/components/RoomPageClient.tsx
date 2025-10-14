'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatSidebar from '@/components/ChatSidebar';
import ActivityTracker from '@/components/ActivityTracker';
import UserActivityFeed from '@/components/UserActivityFeed';
import dynamic from 'next/dynamic';
import { useRoom, useJoinRoom } from '@/hooks/useRooms';
import { useActivity } from '@/hooks/useActivity';
import { useEmojiMarkers } from '@/hooks/useEmojiMarkers';
import { useUser } from '@/hooks/useUser';

// Dynamically import the map component to avoid SSR issues
const RoomMap = dynamic(() => import('@/components/RoomMap'), {
  ssr: false,
  loading: () => (
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
  ),
});

export default function RoomPageClient({ roomSlug }: { roomSlug: string }) {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();

  const { room, isLoading, error: roomError } = useRoom(roomSlug);
  const { joinRoom } = useJoinRoom();

  const { userNames, userLocations } = useActivity(
    room?.id ?? '',
    room?.slug ?? '',
    {
      activity_type: 'location',
      limit: 200,
    }
  );

  const { emojiMarkers } = useEmojiMarkers(
    room?.id ?? '',
    room?.slug ?? '',
    userNames
  );

  // Redirect to sign-in if no user
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, userLoading, router]);

  // Automatically join the room when visiting
  useEffect(() => {
    if (user && roomSlug) {
      try {
        joinRoom(roomSlug);
      } catch (joinErr) {
        console.warn('Failed to join room automatically:', joinErr);
      }
    }
  }, [roomSlug, user, joinRoom]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#f9fafb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              marginBottom: '1rem',
              fontSize: '2rem',
            }}
          >
            ⏳
          </div>
          <p style={{ color: '#6b7280' }}>Loading room...</p>
        </div>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#f9fafb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
            }}
          >
            Room not found
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            {roomError?.message ||
              'The room you are looking for does not exist'}
          </p>
          <Link
            href="/rooms"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            ← Back to Rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#f9fafb',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Link
              href="/rooms"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '0.875rem',
                marginBottom: '0.25rem',
                display: 'block',
              }}
            >
              ← Back to Rooms
            </Link>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {room.name}
            </h1>
          </div>
          <Link
            href="/profile"
            style={{
              padding: '0.5rem 1rem',
              background: '#f3f4f6',
              color: '#374151',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            Profile
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <main
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 0,
          }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <RoomMap
              roomName={room.name}
              location={room.location}
              userLocations={userLocations}
              emojiMarkers={emojiMarkers}
            />

            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '420px',
                pointerEvents: 'none',
              }}
            >
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px', pointerEvents: 'auto' }}>
                  {user && room && <ActivityTracker roomSlug={room.slug} />}
                </div>
                <div style={{ flex: '1 1 300px', pointerEvents: 'auto' }}>
                  {room && (
                    <UserActivityFeed roomId={room.id} roomSlug={room.slug} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Chat Sidebar */}
        <aside
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '400px',
            borderLeft: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            background: 'white',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          {user && room && (
            <ChatSidebar
              roomId={room.id}
              roomSlug={room.slug}
              currentUser={user}
              currentUserLocation={
                userLocations.find(loc => loc.userId === user.id)?.location ||
                null
              }
            />
          )}
        </aside>
      </div>
    </div>
  );
}
