import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * GET /api/rooms/[slug]/activity
 * Fetch activity history for a room with optional filters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { slug } = await params;

    // Get room by slug
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('slug', slug)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const activity_type = searchParams.get('activity_type');
    const user_id = searchParams.get('user_id');
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    let query = supabase
      .from('user_activity')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (activity_type) {
      query = query.eq('activity_type', activity_type);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (since) {
      query = query.gte('created_at', since);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activity:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in activity API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rooms/[slug]/activity
 * Create a new activity entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { slug } = await params;

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get room by slug
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('slug', slug)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const body = await request.json();
    const { activity_type, data } = body;

    // Validate required fields
    if (!activity_type || !data) {
      return NextResponse.json(
        { error: 'activity_type and data are required' },
        { status: 400 }
      );
    }

    // Insert activity
    const { data: activity, error } = await supabase
      .from('user_activity')
      .insert({
        user_id: user.id,
        room_id: room.id,
        activity_type,
        data,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (error) {
    console.error('Error in activity API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
