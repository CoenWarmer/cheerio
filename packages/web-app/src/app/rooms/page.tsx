'use client';

import Link from 'next/link';
import { useRooms } from '@/hooks/useRooms';

export default function RoomsListPage() {
  const { rooms, isLoading: loading, error } = useRooms();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <nav
          style={{
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
            padding: '1rem 2rem',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rooms</h1>
            <Link
              href="/dashboard"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              ← Dashboard
            </Link>
          </div>
        </nav>
        <main
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#6b7280' }}>Loading rooms...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <nav
        style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rooms</h1>
          <Link
            href="/dashboard"
            style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem',
        }}
      >
        {error && (
          <div
            style={{
              padding: '1rem',
              background: '#fee',
              color: '#dc2626',
              borderRadius: '0.5rem',
              marginBottom: '2rem',
            }}
          >
            {error.message || 'Failed to load rooms'}
          </div>
        )}

        {rooms.length === 0 ? (
          <div
            style={{
              background: 'white',
              padding: '3rem 2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
              }}
            >
              No rooms yet
            </h2>
            <p style={{ color: '#6b7280' }}>
              Create your first room to get started!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {rooms.map(room => (
              <Link
                key={room.id}
                href={`/room/${room.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    height: '100%',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow =
                      '0 4px 6px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow =
                      '0 1px 3px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: '#111827',
                      }}
                    >
                      {room.name}
                    </h3>
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
                        🔒
                      </span>
                    )}
                  </div>

                  {room.description && (
                    <p
                      style={{
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        marginBottom: '1rem',
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {room.description}
                    </p>
                  )}

                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #e5e7eb',
                    }}
                  >
                    Created{' '}
                    {new Date(room.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
