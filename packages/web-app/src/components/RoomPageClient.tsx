'use client';

import { useEffect, useState } from 'react';
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
import { useTrackingPaths } from '@/hooks/useTrackingPaths';

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

  const { paths: trackingPaths } = useTrackingPaths(
    room?.id ?? '',
    room?.slug ?? ''
  );

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .chat-sidebar.collapsed {
          right: -400px !important;
        }
        
        .chat-toggle-btn {
          position: absolute;
          left: -40px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 80px;
          background: white;
          border: 1px solid #e5e7eb;
          border-right: none;
          border-radius: 8px 0 0 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s ease;
        }
        
        .chat-toggle-btn:hover {
          background: #f9fafb;
        }
        
        .map-overlay-bottom.sidebar-collapsed {
          right: 20px !important;
        }
        
        @media (max-width: 768px) {
          .chat-sidebar {
            top: auto !important;
            right: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 50vh !important;
            border-left: none !important;
            border-top: 1px solid #e5e7eb !important;
          }
          
          .chat-sidebar.collapsed {
            right: 0 !important;
            bottom: -50vh !important;
          }
          
          .chat-toggle-btn {
            left: 50%;
            top: -40px;
            transform: translateX(-50%);
            width: 80px;
            height: 40px;
            border: 1px solid #e5e7eb;
            border-bottom: none;
            border-radius: 8px 8px 0 0;
          }
          
          .map-overlay-bottom {
            right: 20px !important;
            bottom: calc(50vh + 20px) !important;
          }
          
          .map-overlay-bottom.sidebar-collapsed {
            bottom: 20px !important;
          }
        }
      `,
        }}
      />
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
        {/* <header
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
        </header> */}

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
                trackingPaths={trackingPaths}
              />

              <div
                className={`map-overlay-bottom ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  right: '420px',
                  pointerEvents: 'none',
                  zIndex: 500,
                  transition: 'right 0.3s ease, bottom 0.3s ease',
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

          {/* Chat Sidebar Container */}
          <div
            className={`chat-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '400px',
              zIndex: 1000,
              transition: 'right 0.3s ease, bottom 0.3s ease',
            }}
          >
            {/* Chat Sidebar */}
            <aside
              style={{
                width: '100%',
                height: '100%',
                borderLeft: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.8)',
                overflow: 'hidden',
              }}
            >
              {user && room && (
                <ChatSidebar
                  roomId={room.id}
                  roomSlug={room.slug}
                  roomName={room.name}
                  currentUser={user}
                  currentUserLocation={
                    userLocations.find(loc => loc.userId === user.id)
                      ?.location || null
                  }
                  onToggleSidebar={() =>
                    setIsSidebarCollapsed(!isSidebarCollapsed)
                  }
                />
              )}
            </aside>
          </div>

          <div
            style={{
              position: 'absolute',
              right: '30px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '12px',
              zIndex: 500,
            }}
          >
            {/* Toggle Button */}
            <button
              aria-label={isSidebarCollapsed ? 'Show chat' : 'Hide chat'}
              title={isSidebarCollapsed ? 'Show chat' : 'Hide chat'}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{
                display: 'flex',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'white',
                border: '2px solid #e5e7eb',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '5px',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '35px' }}>
                {isSidebarCollapsed ? '💬' : '✕'}
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#666',
                }}
              >
                Chat
              </span>
            </button>

            {/* Megaphone Button */}
            <button
              style={{
                display: 'flex',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'white',
                border: '2px solid #e5e7eb',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '5px',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                console.log('Megaphone button clicked');
              }}
              aria-label="Broadcast"
              title="Broadcast"
            >
              <span style={{ fontSize: '35px' }}>📣</span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#666',
                }}
              >
                Cheer
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
