import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { profilesApi } from '@/lib/api-client';
import type { UserPermission } from '@/types/permissions';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  permissions: UserPermission;
}

interface UseProfileResult {
  user: User | null;
  profile: Profile | null;
  permissions: UserPermission | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage current user's profile
 * Handles authentication check and profile data fetching
 */
export function useProfile(): UseProfileResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<UserPermission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUser(null);
        setProfile(null);
        setPermissions(null);
        return;
      }

      setUser(user);

      const profileResult = await profilesApi.getCurrent();
      setProfile(profileResult.data);
      setPermissions(profileResult.data.permissions);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    user,
    profile,
    permissions,
    loading,
    error,
    refetch: fetchProfile,
  };
}
