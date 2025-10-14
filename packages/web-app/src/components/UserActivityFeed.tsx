'use client';

import { useState } from 'react';
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
      <div
        style={{
          padding: '1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.375rem',
          color: '#dc2626',
        }}
      >
        {error.message || 'Failed to load activity'}
      </div>
    );
  }

  // Server already filters out current user
  const otherUsers = summaries;

  if (isLoading) {
    return (
      <div
        style={{
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '0.5rem',
          color: '#6b7280',
          fontSize: '0.875rem',
        }}
      >
        Loading activity...
      </div>
    );
  }

  if (otherUsers.length === 0) {
    return (
      <div
        style={{
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '0.5rem',
          color: '#4b5563',
          fontSize: '0.875rem',
        }}
      >
        No other users are currently sharing their activity.
      </div>
    );
  }

  // Filter to show only selected user or all users
  const usersToDisplay =
    selectedUserId && otherUsers.length > 1
      ? otherUsers.filter(u => u.userId === selectedUserId)
      : otherUsers;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Dropdown selector when multiple users */}
      {otherUsers.length > 1 && (
        <div style={{ padding: '0 1rem 1rem 1rem' }}>
          <select
            value={selectedUserId || 'all'}
            onChange={e =>
              setSelectedUserId(
                e.target.value === 'all' ? null : e.target.value
              )
            }
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Users ({otherUsers.length})</option>
            {otherUsers.map(summary => {
              const displayName =
                summary.userName || `User ${summary.userId.substring(0, 8)}`;
              return (
                <option key={summary.userId} value={summary.userId}>
                  {displayName}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '0 1rem 1rem 1rem',
        }}
      >
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
            <div
              key={summary.userId}
              style={{
                padding: '1rem',
                background: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      background: '#3b82f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                    }}
                  >
                    {initials}
                  </div>
                  <span style={{ fontWeight: '500', color: '#1f2937' }}>
                    {displayName}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {summary.lastLocation && (
                  <div
                    style={{
                      padding: '0.5rem',
                      background: '#eff6ff',
                      borderRadius: '0.375rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#4b5563',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Location
                    </div>
                    <div style={{ fontWeight: '500', color: '#1d4ed8' }}>
                      {summary.lastLocation.lat.toFixed(5)},{' '}
                      {summary.lastLocation.long.toFixed(5)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '0.25rem',
                      }}
                    >
                      {formatTime(summary.lastLocation.timestamp)}
                    </div>
                  </div>
                )}

                {summary.lastSpeed && (
                  <div
                    style={{
                      padding: '0.5rem',
                      background: '#f0fdf4',
                      borderRadius: '0.375rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#4b5563',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Speed
                    </div>
                    <div style={{ fontWeight: '500', color: '#15803d' }}>
                      {summary.lastSpeed.speed.toFixed(1)}{' '}
                      {summary.lastSpeed.unit}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '0.25rem',
                      }}
                    >
                      {formatTime(summary.lastSpeed.timestamp)}
                    </div>
                  </div>
                )}

                {summary.lastDistance && (
                  <div
                    style={{
                      padding: '0.5rem',
                      background: '#faf5ff',
                      borderRadius: '0.375rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#4b5563',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Distance
                    </div>
                    <div style={{ fontWeight: '500', color: '#7e22ce' }}>
                      {summary.lastDistance.distance.toFixed(2)}{' '}
                      {summary.lastDistance.unit}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '0.25rem',
                      }}
                    >
                      {formatTime(summary.lastDistance.timestamp)}
                    </div>
                  </div>
                )}

                {summary.lastMusic && (
                  <div
                    style={{
                      padding: '0.5rem',
                      background: '#fdf2f8',
                      borderRadius: '0.375rem',
                      gridColumn: 'span 2',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#4b5563',
                        marginBottom: '0.25rem',
                      }}
                    >
                      🎵 Listening to
                    </div>
                    <div style={{ fontWeight: '500', color: '#be185d' }}>
                      {summary.lastMusic.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#db2777' }}>
                      {summary.lastMusic.artist}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '0.25rem',
                      }}
                    >
                      {formatTime(summary.lastMusic.timestamp)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
