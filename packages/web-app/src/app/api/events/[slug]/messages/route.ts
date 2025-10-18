import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { validateUserId } from '@/lib/validate-user-id';

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

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('event_id', event.id)
      .eq('deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get unique user IDs
    const userIds = Array.from(new Set(messages.map(m => m.user_id)));

    // Fetch profiles for all users (both authenticated and anonymous)
    // Note: User IDs can reference either 'profiles' or 'anonymous_profiles'
    const [authenticatedProfiles, anonymousProfiles] = await Promise.all([
      supabase.from('profiles').select('id, display_name').in('id', userIds),
      supabase
        .from('anonymous_profiles')
        .select('id, display_name')
        .in('id', userIds),
    ]);

    // Combine profiles from both tables
    const profileMap = new Map<string, string | null>();
    authenticatedProfiles.data?.forEach(p =>
      profileMap.set(p.id, p.display_name)
    );
    anonymousProfiles.data?.forEach(p => profileMap.set(p.id, p.display_name));

    // Enrich messages with user names
    const enrichedMessages = messages.map(msg => ({
      ...msg,
      user_name: profileMap.get(msg.user_id) || null,
    }));

    return NextResponse.json({ data: enrichedMessages });
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
