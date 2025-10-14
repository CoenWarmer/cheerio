'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  roomsApi,
  roomMembersApi,
  profilesApi,
  ApiError,
} from '@/lib/api-client';
import { activityApi } from '@/lib/activity-client';
import type { User } from '@supabase/supabase-js';
import ChatSidebar from '@/components/ChatSidebar';
import ActivityTracker from '@/components/ActivityTracker';
import UserActivityFeed from '@/components/UserActivityFeed';
import dynamic from 'next/dynamic';

import { Room } from '@/types/types';
import type { UserActivity, LocationActivity } from '@/types/activity';

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

interface UserLocationMarker {
  userId: string;
  userName?: string;
  avatarUrl?: string;
  location: LocationActivity;
  timestamp: string;
}

export default function RoomPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const roomSlug = params.slug;

  const [room, setRoom] = useState<Room | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocations, setUserLocations] = useState<UserLocationMarker[]>([]);
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());
  const [userAvatars, setUserAvatars] = useState<Map<string, string>>(
    new Map()
  );

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/sign-in');
          return;
        }

        setUser(user);

        // Fetch room data via API (using slug)
        const result = await roomsApi.getById(roomSlug);
        setRoom(result.data);

        // Automatically join the room when visiting
        try {
          await roomsApi.join(roomSlug);
        } catch (joinErr) {
          // Non-critical error - log but don't prevent page load
          console.warn('Failed to join room automatically:', joinErr);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.status === 404 ? 'Room not found' : err.message);
        } else {
          setError('Failed to load room');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [roomSlug, router]);

  // Fetch user names for display
  useEffect(() => {
    if (!room?.slug) return;

    const fetchUserNames = async () => {
      try {
        // Get all members of the room via API
        const membersResult = await roomMembersApi.getByRoomSlug(room.slug);
        const members = membersResult.data;

        // Fetch profiles for all members via API
        if (members && members.length > 0) {
          const userIds = members.map(m => m.user_id);
          const { names, avatars } =
            await profilesApi.getUserProfilesMap(userIds);

          setUserNames(names);
          setUserAvatars(avatars);
        } else {
          setUserNames(new Map());
        }
      } catch (err) {
        console.error('Error fetching user names:', err);
      }
    };

    fetchUserNames();
  }, [room?.slug]);

  // Fetch and subscribe to user locations
  useEffect(() => {
    if (!room?.id || !room?.slug) return;

    // Fetch initial user locations (most recent location per user) via API
    const fetchUserLocations = async () => {
      try {
        const result = await activityApi.getActivities(room.slug, {
          activity_type: 'location',
          limit: 200,
        });

        // Get unique user IDs from activities
        const userIds = Array.from(
          new Set(
            result.data
              .filter(a => a.activity_type === 'location')
              .map(a => a.user_id)
          )
        );

        // Fetch profiles for users we don't have yet
        const missingUserIds = userIds.filter(id => !userNames.has(id));

        // Create local copies that we'll use synchronously
        const localUserNames = new Map(userNames);
        const localUserAvatars = new Map(userAvatars);

        if (missingUserIds.length > 0) {
          try {
            const { names, avatars } =
              await profilesApi.getUserProfilesMap(missingUserIds);

            // Merge with existing profiles
            names.forEach((name, id) => {
              localUserNames.set(id, name);
            });

            avatars.forEach((avatar, id) => {
              localUserAvatars.set(id, avatar);
            });

            // Update state with new profiles
            setUserNames(localUserNames);
            setUserAvatars(localUserAvatars);
          } catch (err) {
            console.error('Error fetching user profiles:', err);
          }
        }

        // Get most recent location per user
        const locationMap = new Map<string, UserLocationMarker>();
        result.data.forEach(activity => {
          if (
            activity.activity_type === 'location' &&
            !locationMap.has(activity.user_id)
          ) {
            locationMap.set(activity.user_id, {
              userId: activity.user_id,
              userName: localUserNames.get(activity.user_id),
              avatarUrl: localUserAvatars.get(activity.user_id),
              location: activity.data as unknown as LocationActivity,
              timestamp: activity.created_at,
            });
          }
        });

        setUserLocations(Array.from(locationMap.values()));
      } catch (err) {
        console.error('Error fetching user locations:', err);
      }
    };

    fetchUserLocations();

    // Subscribe to real-time location updates
    const channel = supabase
      .channel(`room-locations-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
          filter: `room_id=eq.${room.id}`,
        },
        async payload => {
          const newActivity = payload.new as UserActivity;

          // Only update if it's a location activity
          if (newActivity.activity_type === 'location') {
            // Get or fetch user profile data
            let userName = userNames.get(newActivity.user_id);
            let avatarUrl = userAvatars.get(newActivity.user_id);

            // Fetch profile if we don't have it
            if (!userName) {
              try {
                const { names, avatars } = await profilesApi.getUserProfilesMap(
                  [newActivity.user_id]
                );

                userName = names.get(newActivity.user_id) || undefined;
                avatarUrl = avatars.get(newActivity.user_id) || undefined;

                // Update state for future use
                if (userName) {
                  setUserNames(prev => {
                    const newMap = new Map(prev);
                    newMap.set(newActivity.user_id, userName!);
                    return newMap;
                  });
                }

                if (avatarUrl) {
                  setUserAvatars(prev => {
                    const newMap = new Map(prev);
                    newMap.set(newActivity.user_id, avatarUrl!);
                    return newMap;
                  });
                }
              } catch (err) {
                console.error('Error fetching user profile:', err);
              }
            }

            // Update location with profile data
            setUserLocations(prev => {
              const filtered = prev.filter(
                loc => loc.userId !== newActivity.user_id
              );
              return [
                ...filtered,
                {
                  userId: newActivity.user_id,
                  userName,
                  avatarUrl,
                  location: newActivity.data as LocationActivity,
                  timestamp: newActivity.created_at,
                },
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [room?.id, room?.slug, userNames, userAvatars]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#6b7280' }}>Loading room...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          padding: '1rem',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            width: '100%',
            background: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}
          >
            {error || 'Room not found'}
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            The room you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to view it.
          </p>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-block',
              padding: '0.625rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f9fafb',
        overflow: 'hidden',
      }}
    >
      <nav
        style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/dashboard"
            style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            ← Back to Dashboard
          </Link>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: '#6b7280',
            }}
          >
            {room.is_private && (
              <span
                style={{
                  padding: '0.25rem 0.5rem',
                  background: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                }}
              >
                🔒 Private
              </span>
            )}
          </div>
        </div>
      </nav>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* Main Content Area - Full Width */}
        <main
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Map Background - Full Size */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
            }}
          >
            <RoomMap
              roomName={room.name}
              location={room.location}
              userLocations={userLocations}
            />
          </div>

          {/* Top Overlay - Room Info */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '1.5rem',
              paddingRight: '420px', // Space for chat sidebar (400px + 20px gap)
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                maxWidth: '600px',
              }}
            >
              {/* Room Info Card */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  pointerEvents: 'auto',
                }}
              >
                <h1
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                  }}
                >
                  {room.name}
                </h1>

                {room.description && (
                  <p
                    style={{
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      marginBottom: '1rem',
                      lineHeight: '1.5',
                    }}
                  >
                    {room.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #e5e7eb',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                  }}
                >
                  <div>
                    <strong style={{ color: '#111827' }}>Created:</strong>{' '}
                    {new Date(room.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Overlay - Activity Tracker */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              marginTop: 'auto',
              padding: '1.5rem',
              paddingRight: '420px', // Space for chat sidebar (400px + 20px gap)
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                pointerEvents: 'auto',
              }}
            >
              <ActivityTracker roomSlug={room.slug} />

              <UserActivityFeed roomSlug={room.slug} roomId={room.id} />
            </div>
          </div>
        </main>

        {/* Chat Sidebar - Overlays on top */}
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
            background: 'rgba(255, 255, 255, 0.9)',
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {user && room && (
            <ChatSidebar
              roomId={room.id}
              roomSlug={room.slug}
              currentUser={user}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
