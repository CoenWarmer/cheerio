import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * POST /api/rooms/[slug]/presence
 * Updates user's presence in a room
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
      console.error('Presence API - Auth failed:', {
        userError,
        hasUser: !!user,
        authHeader:
          request.headers.get('authorization')?.substring(0, 20) + '...',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Get room by slug to get the room ID
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('slug', slug)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status = 'online', metadata = {} } = body;

    // Upsert presence record (insert or update)
    const { data, error } = await supabase
      .from('presence')
      .upsert(
        {
          user_id: user.id,
          room_id: room.id,
          status,
          metadata,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,room_id',
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
 * GET /api/rooms/[slug]/presence
 * Gets all active users in a room
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();

    const { slug } = await params;

    // Get room by slug to get the room ID
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('slug', slug)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get presence records updated in the last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

    const { data, error } = await supabase
      .from('presence')
      .select('*')
      .eq('room_id', room.id)
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
 * DELETE /api/rooms/[slug]/presence
 * Removes user's presence from a room
 */
export async function DELETE(
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

    // Get room by slug to get the room ID
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('slug', slug)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Delete presence record
    const { error } = await supabase
      .from('presence')
      .delete()
      .eq('user_id', user.id)
      .eq('room_id', room.id);

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
