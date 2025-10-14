'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>(
    'checking'
  );
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function checkConnection() {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .limit(1);

        if (
          error &&
          error.message.includes('relation "_test_" does not exist')
        ) {
          // This is expected if there are no tables yet
          setStatus('connected');
        } else if (error) {
          setStatus('error');
          setError(error.message);
        } else {
          setStatus('connected');
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    checkConnection();
  }, []);

  if (status === 'checking') {
    return (
      <div
        style={{
          padding: '1rem',
          background: '#f3f4f6',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <p>🔄 Checking Supabase connection...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        style={{
          padding: '1rem',
          background: '#fee',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <p>❌ Supabase connection error</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Make sure you&apos;ve set up your .env.local file with valid
          credentials.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '1rem',
        background: '#efe',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
      }}
    >
      <p>✅ Supabase connected successfully!</p>
    </div>
  );
}
