'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current user
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/sign-in');
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/sign-in');
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/sign-in');
    router.refresh();
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Cheerio Dashboard
          </h1>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
            }}
          >
            Welcome! 👋
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            You&apos;re successfully authenticated with Supabase.
          </p>

          <div
            style={{
              background: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          >
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Email:</strong> {user.email}
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>User ID:</strong> {user.id}
            </p>
            <p>
              <strong>Created:</strong>{' '}
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
              }}
            >
              Quick Links
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <Link
                href="/profile"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#fde68a';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#fef3c7';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                👤 Edit Profile →
              </Link>
              <Link
                href="/new"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: '#dcfce7',
                  color: '#166534',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#bbf7d0';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#dcfce7';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                ➕ Create New Room →
              </Link>
              <Link
                href="/rooms"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: '#eff6ff',
                  color: '#1e40af',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#dbeafe';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#eff6ff';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                🏠 View All Rooms →
              </Link>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
              }}
            >
              Getting Started
            </h3>
            <ul
              style={{
                color: '#6b7280',
                lineHeight: '1.75',
                paddingLeft: '1.5rem',
                fontSize: '0.875rem',
              }}
            >
              <li>This is your protected dashboard page</li>
              <li>Only authenticated users can access this page</li>
              <li>You can now build features that require authentication</li>
              <li>
                Check out the Supabase docs for database queries, storage, and
                more
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
