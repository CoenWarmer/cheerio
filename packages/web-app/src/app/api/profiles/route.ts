import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * GET /api/profiles?ids=uuid1,uuid2,uuid3
 * Fetch user profiles by IDs
 * Supports both authenticated users (profiles table) and anonymous users (anonymous_profiles table)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'ids parameter is required' },
        { status: 400 }
      );
    }

    const ids = idsParam
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch from both profiles and anonymous_profiles tables
    const [profilesResult, anonymousResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, avatar_url, permissions')
        .in('id', ids),
      supabase
        .from('anonymous_profiles')
        .select('id, display_name')
        .in('id', ids),
    ]);

    console.log('Profiles query:', {
      ids,
      profilesCount: profilesResult.data?.length || 0,
      anonymousCount: anonymousResult.data?.length || 0,
      profilesError: profilesResult.error?.message,
      anonymousError: anonymousResult.error?.message,
    });

    if (profilesResult.error) {
      console.error('Error fetching profiles:', profilesResult.error);
      return NextResponse.json(
        { error: profilesResult.error.message },
        { status: 500 }
      );
    }

    if (anonymousResult.error) {
      console.error(
        'Error fetching anonymous profiles:',
        anonymousResult.error
      );
      return NextResponse.json(
        { error: anonymousResult.error.message },
        { status: 500 }
      );
    }

    // Merge results - authenticated profiles have permissions and avatars, anonymous don't
    const authenticatedProfiles = profilesResult.data || [];
    const anonymousProfiles = (anonymousResult.data || []).map(profile => ({
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: null, // Anonymous users don't have avatars
      permissions: 'supporter' as const, // Default permission for anonymous users
    }));

    const allProfiles = [...authenticatedProfiles, ...anonymousProfiles];

    console.log('Merged profiles:', {
      total: allProfiles.length,
      authenticated: authenticatedProfiles.length,
      anonymous: anonymousProfiles.length,
    });

    // If no profiles found but IDs were provided, return empty profiles as fallback
    // This prevents errors when profiles don't exist yet
    if (allProfiles.length === 0 && ids.length > 0) {
      console.warn('No profiles found for IDs:', ids);
      // Return placeholder profiles with IDs so the UI doesn't break
      const placeholders = ids.map(id => ({
        id,
        display_name: 'Anonymous User',
        avatar_url: null,
        permissions: 'supporter' as const,
      }));
      return NextResponse.json({ data: placeholders });
    }

    return NextResponse.json({ data: allProfiles });
  } catch (error) {
    console.error('Error in profiles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
