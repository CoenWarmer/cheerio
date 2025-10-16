'use client';

import { useUser } from './useUser';
import { useAnonymousUser } from './useAnonymousUser';

export interface CurrentUser {
  id: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
}

interface UseCurrentUserResult {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
}

/**
 * Hook that provides the current user, whether authenticated or anonymous
 * This abstracts away the difference between authenticated and anonymous users
 * for components that just need to know "who is the current user"
 */
export function useCurrentUser(): UseCurrentUserResult {
  const { user, isLoading: userLoading } = useUser();
  const {
    anonymousId,
    anonymousProfile,
    isAnonymous,
    isLoading: anonymousLoading,
  } = useAnonymousUser();

  const isLoading = userLoading || anonymousLoading;

  // Authenticated user takes precedence
  if (user) {
    return {
      currentUser: {
        id: user.id,
        displayName: user.user_metadata?.display_name || null,
        email: user.email || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
        isAuthenticated: true,
        isAnonymous: false,
      },
      isLoading,
      isAuthenticated: true,
      isAnonymous: false,
    };
  }

  // Anonymous user
  if (isAnonymous && anonymousProfile) {
    return {
      currentUser: {
        id: anonymousId!,
        displayName: anonymousProfile.display_name,
        email: null,
        avatarUrl: null,
        isAuthenticated: false,
        isAnonymous: true,
      },
      isLoading,
      isAuthenticated: false,
      isAnonymous: true,
    };
  }

  // No user
  return {
    currentUser: null,
    isLoading,
    isAuthenticated: false,
    isAnonymous: false,
  };
}
