/**
 * Validates and returns the user ID for API requests
 * Prevents impersonation by:
 * - Using auth session ID for authenticated users (ignores client-provided ID)
 * - Verifying anonymous profile exists before trusting client-provided ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export async function validateUserId(
  supabase: SupabaseClient<Database>,
  clientProvidedUserId?: string
): Promise<{ userId: string; error: null } | { userId: null; error: string }> {
  // Get authenticated user (if logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated user: MUST use their auth ID (ignore client-provided)
  if (user) {
    return { userId: user.id, error: null };
  }

  // Anonymous user: verify the profile exists
  if (clientProvidedUserId) {
    const { data: anonymousProfile, error: profileError } = await supabase
      .from('anonymous_profiles')
      .select('id')
      .eq('id', clientProvidedUserId)
      .single();

    if (profileError || !anonymousProfile) {
      return {
        userId: null,
        error: 'Invalid user ID - anonymous profile not found',
      };
    }

    return { userId: clientProvidedUserId, error: null };
  }

  // No user ID available
  return {
    userId: null,
    error: 'User ID required (authenticated or anonymous)',
  };
}
