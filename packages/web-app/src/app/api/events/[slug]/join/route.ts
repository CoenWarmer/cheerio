import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * POST /api/events/[slug]/join
 * Adds a user (authenticated or anonymous) as a member of the specified event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { slug } = await params;

    // Try to get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get user_id from request body (for anonymous users) or auth session
    const body = await request.json().catch(() => ({}));
    const userId = body.user_id || user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required (authenticated or anonymous)' },
        { status: 400 }
      );
    }

    // Get event by slug to get the event ID
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventId = event.id;

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('event_members')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    // If already a member, return success
    if (existingMember) {
      console.log(
        `Join API - User ${userId} is already a member of event ${eventId}`
      );
      return NextResponse.json({
        success: true,
        alreadyMember: true,
      });
    }

    // Add user as a member
    console.log(
      `Join API - Adding user ${userId} to event ${eventId} (slug: ${slug})`
    );
    const { data, error } = await supabase
      .from('event_members')
      .insert({
        event_id: eventId,
        user_id: userId,
        role: 'member', // Default role
      })
      .select()
      .single();

    if (error) {
      console.error('Join API - Error joining event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Join API - Successfully added user ${userId} to event:`, data);

    return NextResponse.json({
      success: true,
      member: data,
    });
  } catch (error) {
    console.error('Error in join event API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
