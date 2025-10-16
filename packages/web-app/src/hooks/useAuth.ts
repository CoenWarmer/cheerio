'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUser } from './useUser';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const { user: initialUser, isLoading } = useUser();
  const [user, setUser] = useState<User | null>(initialUser);
  const router = useRouter();

  // Sync initial user from useUser hook
  useEffect(() => {
    if (!isLoading) {
      setUser(initialUser);
    }
  }, [initialUser, isLoading]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN') {
        router.refresh();
      }
      if (event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return {
    user,
    loading: isLoading,
    signOut: async () => {
      await supabase.auth.signOut();
      router.push('/');
    },
  };
}
