import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// GET /api/events/[slug]/messages - Get messages for a event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();
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

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('event_id', event.id)
      .eq('deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/events/[slug]/messages - Create a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { slug } = await params;
    const body = await request.json();

    const { content, attachment, location, user_id } = body;

    // Get authenticated user (if logged in)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Support both authenticated users and anonymous users
    // Authenticated users: use session user_id
    // Anonymous users: use provided user_id from request body
    const userId = user_id || user?.id;

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

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        content,
        event_id: event.id,
        user_id: userId,
        attachment: attachment || null,
        location: location || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
