import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * GET /api/events/[slug]/members
 * Fetch all members of a event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { slug } = await params;

    // Get current user for auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Members API - Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get event by slug
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (eventError || !event) {
      console.error('Members API - Event not found:', {
        slug,
        error: eventError,
      });
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch event members with their profiles (including permissions)
    const { data: members, error: membersError } = await supabase
      .from('event_members')
      .select('user_id, joined_at')
      .eq('event_id', event.id);

    if (membersError) {
      console.error('Error fetching event members:', membersError);
      return NextResponse.json(
        { error: membersError.message },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      console.log('Members API - No members found, returning empty array');
      return NextResponse.json({ data: [] });
    }

    // Fetch profiles for all members
    const userIds = members.map(m => m.user_id);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, permissions')
      .in('id', userIds);

    if (profilesError) {
      console.error('Members API - Error fetching profiles:', profilesError);
      // Return members without profile data if profiles fetch fails
      return NextResponse.json({ data: members });
    }

    // Merge members with their profiles
    const enrichedMembers = members.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id);
      if (!profile) {
        console.log(
          `Members API - WARNING: No profile found for user ${member.user_id}`
        );
      }
      return {
        user_id: member.user_id,
        joined_at: member.joined_at,
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null,
        permissions: profile?.permissions || 'supporter',
      };
    });

    console.log(
      'Members API - Returning enriched members:',
      enrichedMembers.map(m => ({
        id: m.user_id.substring(0, 8),
        name: m.display_name,
        perm: m.permissions,
      }))
    );

    return NextResponse.json({ data: enrichedMembers });
  } catch (error) {
    console.error('Error in event members API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
