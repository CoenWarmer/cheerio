'use client';

import { useUser } from './useUser';
import { useCurrentProfile } from './useProfiles';
import type { UserPermission } from '@/types/permissions';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  permissions?: UserPermission;
}

interface UseProfileResult {
  user: User | null;
  profile: Profile | null;
  permissions: UserPermission | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch and manage current user's profile
 * Combines user authentication data with profile data
 */
export function useProfile(): UseProfileResult {
  const { user, isLoading: userLoading, error: userError } = useUser();
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useCurrentProfile();

  const refetch = async () => {
    await refetchProfile();
  };

  return {
    user,
    profile,
    permissions: profile?.permissions ?? null,
    loading: userLoading || profileLoading,
    error: userError?.message || profileError?.message || null,
    refetch,
  };
}
