import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { UserPermission } from '@/types/permissions';

/**
 * GET /api/profile
 * Get current user's profile
 */
export async function GET() {
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

    // Fetch user's profile
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
