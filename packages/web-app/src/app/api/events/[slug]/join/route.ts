import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * POST /api/events/[slug]/join
 * Adds the current user as a member of the specified event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

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
      .eq('user_id', user.id)
      .single();

    // If already a member, return success
    if (existingMember) {
      console.log(
        `Join API - User ${user.id} is already a member of event ${eventId}`
      );
      return NextResponse.json({
        success: true,
        alreadyMember: true,
      });
    }

    // Add user as a member
    console.log(
      `Join API - Adding user ${user.id} to event ${eventId} (slug: ${slug})`
    );
    const { data, error } = await supabase
      .from('event_members')
      .insert({
        event_id: eventId,
        user_id: user.id,
        role: 'member', // Default role
      })
      .select()
      .single();

    if (error) {
      console.error('Join API - Error joining event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(
      `Join API - Successfully added user ${user.id} to event:`,
      data
    );

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
