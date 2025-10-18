import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { validateUserId } from '@/lib/validate-user-id';

/**
 * POST /api/events/[slug]/presence
 * Updates user's presence in a event
 * Supports both authenticated users (via auth session) and anonymous users (via user_id in body)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();

    // Parse request body
    const body = await request.json();
    const { status = 'online', metadata = {}, user_id } = body;

    // Validate user ID (prevents impersonation)
    const { userId, error: userIdError } = await validateUserId(
      supabase,
      user_id
    );

    if (!userId || userIdError) {
      return NextResponse.json(
        { error: userIdError || 'User ID required' },
        { status: 403 }
      );
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

    // Upsert presence record (insert or update)
    const { data, error } = await supabase
      .from('presence')
      .upsert(
        {
          user_id: userId,
          event_id: event.id,
          status,
          metadata,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,event_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating presence:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, presence: data });
  } catch (error) {
    console.error('Error in presence API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events/[slug]/presence
 * Gets all active users in a event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();

    const { slug } = await params;

    // Note: Anonymous users can view presence (public access via RLS)
    // Auth check removed to support anonymous users

    // Get event by slug to get the event ID
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get presence records updated in the last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

    const { data, error } = await supabase
      .from('presence')
      .select('*')
      .eq('event_id', event.id)
      .eq('status', 'online')
      .gte('updated_at', thirtySecondsAgo);

    if (error) {
      console.error('Error fetching presence:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count: data?.length || 0 });
  } catch (error) {
    console.error('Error in presence API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[slug]/presence
 * Removes user's presence from a event
 * Supports both authenticated users (via auth session) and anonymous users (via user_id in body)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { user_id } = body;

    // Validate user ID (prevents impersonation)
    const { userId, error: userIdError } = await validateUserId(
      supabase,
      user_id
    );

    if (!userId || userIdError) {
      return NextResponse.json(
        { error: userIdError || 'User ID required' },
        { status: 403 }
      );
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

    // Delete presence record
    const { error } = await supabase
      .from('presence')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', event.id);

    if (error) {
      console.error('Error deleting presence:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in presence API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
