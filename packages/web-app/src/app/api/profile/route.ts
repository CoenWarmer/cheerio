import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { UserPermission } from '@/types/permissions';

/**
 * GET /api/profile
 * Get current user's profile
 * Supports both authenticated users (profiles table) and anonymous users (anonymous_profiles table)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Try to get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If authenticated user exists, fetch from profiles table
    if (user?.id) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" - that's ok, profile might not exist yet
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // If profile doesn't exist, return empty profile structure
      if (!profile) {
        return NextResponse.json({
          data: {
            id: user.id,
            display_name: null,
            avatar_url: null,
            permissions: 'supporter', // Default permission
            created_at: null,
          },
        });
      }

      return NextResponse.json({ data: profile });
    }

    // Not authenticated - check for anonymous user ID in query params or body
    const url = new URL(request.url);
    const anonymousId = url.searchParams.get('user_id');

    if (!anonymousId) {
      return NextResponse.json(
        { error: 'No user ID provided' },
        { status: 400 }
      );
    }

    // Fetch from anonymous_profiles table
    const { data: anonymousProfile, error } = await supabase
      .from('anonymous_profiles')
      .select('*')
      .eq('id', anonymousId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching anonymous profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If anonymous profile doesn't exist, return empty structure
    if (!anonymousProfile) {
      return NextResponse.json({
        data: {
          id: anonymousId,
          display_name: null,
          avatar_url: null,
          created_at: null,
        },
      });
    }

    return NextResponse.json({ data: anonymousProfile });
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, avatar_url, permissions } = body;

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    let result;

    if (existingProfile) {
      // Update existing profile
      const updateData: {
        display_name?: string;
        avatar_url?: string;
        permissions?: UserPermission;
      } = {};
      if (display_name !== undefined) updateData.display_name = display_name;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
      // Note: Only allow admins to change permissions in production
      // For now, we allow it but you should add permission checks
      if (permissions !== undefined) updateData.permissions = permissions;

      result = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
    } else {
      // Insert new profile
      result = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name: display_name || null,
          avatar_url: avatar_url || null,
          permissions: permissions || 'supporter',
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error updating profile:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error in profile update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
